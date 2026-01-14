# Model Registry Templates

Production-ready model registry implementations for model versioning, metadata management, artifact storage, and deployment lifecycle.

## Overview

- **Custom Model Registry**: Full-featured registry with PostgreSQL and S3
- **Model Versioning**: Semantic versioning with lineage tracking
- **Model Artifacts**: Artifact storage with compression and checksums
- **Deployment Management**: Model promotion and rollback workflows

## Quick Start

```bash
# Install dependencies
pip install boto3 asyncpg pydantic sqlalchemy alembic

# Initialize database
alembic upgrade head

# Start registry API
uvicorn model_registry.api:app --reload
```

## Model Registry Core

```python
# model_registry/core.py
"""Core model registry implementation."""
import hashlib
import json
import gzip
import tempfile
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, BinaryIO
from dataclasses import dataclass, field
import asyncio
import asyncpg
import boto3
from botocore.config import Config
from pydantic import BaseModel, Field


class ModelStage(str, Enum):
    """Model lifecycle stages."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    ARCHIVED = "archived"


class ModelFramework(str, Enum):
    """Supported ML frameworks."""
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    SKLEARN = "sklearn"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    ONNX = "onnx"
    CUSTOM = "custom"


class ModelMetadata(BaseModel):
    """Model metadata schema."""
    name: str
    version: str
    framework: ModelFramework
    description: str = ""
    tags: dict[str, str] = Field(default_factory=dict)
    metrics: dict[str, float] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    input_schema: dict[str, Any] | None = None
    output_schema: dict[str, Any] | None = None
    training_dataset: str | None = None
    created_by: str | None = None


class ModelVersion(BaseModel):
    """Model version record."""
    id: str
    name: str
    version: str
    stage: ModelStage
    framework: ModelFramework
    artifact_path: str
    artifact_size: int
    checksum: str
    metadata: ModelMetadata
    created_at: datetime
    updated_at: datetime
    promoted_at: datetime | None = None
    promoted_by: str | None = None


class ArtifactStore:
    """S3-based artifact storage."""

    def __init__(
        self,
        bucket: str,
        prefix: str = "models",
        endpoint_url: str | None = None,
    ):
        self.bucket = bucket
        self.prefix = prefix

        config = Config(
            retries={"max_attempts": 3, "mode": "adaptive"},
            signature_version="s3v4",
        )

        self.s3 = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            config=config,
        )

    def _make_key(self, name: str, version: str, filename: str) -> str:
        """Create S3 key for artifact."""
        return f"{self.prefix}/{name}/{version}/{filename}"

    def upload_artifact(
        self,
        name: str,
        version: str,
        file_path: Path | str,
        compress: bool = True,
    ) -> tuple[str, int, str]:
        """Upload model artifact to S3.

        Args:
            name: Model name
            version: Model version
            file_path: Local file path
            compress: Whether to gzip compress

        Returns:
            Tuple of (s3_key, size_bytes, checksum)
        """
        file_path = Path(file_path)
        filename = file_path.name

        if compress and not filename.endswith(".gz"):
            filename = f"{filename}.gz"

        s3_key = self._make_key(name, version, filename)

        # Calculate checksum and optionally compress
        hasher = hashlib.sha256()

        if compress and not file_path.suffix == ".gz":
            with tempfile.NamedTemporaryFile(delete=False, suffix=".gz") as tmp:
                with open(file_path, "rb") as f_in:
                    with gzip.open(tmp.name, "wb") as f_out:
                        while chunk := f_in.read(8192):
                            f_out.write(chunk)

                upload_path = Path(tmp.name)
        else:
            upload_path = file_path

        # Calculate checksum
        with open(upload_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)

        checksum = hasher.hexdigest()
        size = upload_path.stat().st_size

        # Upload
        self.s3.upload_file(
            str(upload_path),
            self.bucket,
            s3_key,
            ExtraArgs={
                "Metadata": {
                    "checksum": checksum,
                    "original_name": file_path.name,
                },
            },
        )

        return s3_key, size, checksum

    def download_artifact(
        self,
        s3_key: str,
        destination: Path | str,
        decompress: bool = True,
    ) -> Path:
        """Download model artifact from S3.

        Args:
            s3_key: S3 object key
            destination: Local destination path
            decompress: Whether to decompress gzipped files

        Returns:
            Path to downloaded file
        """
        destination = Path(destination)
        destination.parent.mkdir(parents=True, exist_ok=True)

        if s3_key.endswith(".gz") and decompress:
            # Download to temp and decompress
            with tempfile.NamedTemporaryFile(delete=False, suffix=".gz") as tmp:
                self.s3.download_file(self.bucket, s3_key, tmp.name)

                # Decompress
                final_path = destination.with_suffix("")
                with gzip.open(tmp.name, "rb") as f_in:
                    with open(final_path, "wb") as f_out:
                        while chunk := f_in.read(8192):
                            f_out.write(chunk)

                Path(tmp.name).unlink()
                return final_path
        else:
            self.s3.download_file(self.bucket, s3_key, str(destination))
            return destination

    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
    ) -> str:
        """Generate presigned URL for artifact download."""
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": s3_key},
            ExpiresIn=expiration,
        )

    def delete_artifact(self, s3_key: str) -> None:
        """Delete artifact from S3."""
        self.s3.delete_object(Bucket=self.bucket, Key=s3_key)

    def list_versions(self, name: str) -> list[str]:
        """List all versions for a model."""
        prefix = f"{self.prefix}/{name}/"
        response = self.s3.list_objects_v2(
            Bucket=self.bucket,
            Prefix=prefix,
            Delimiter="/",
        )

        versions = []
        for prefix_obj in response.get("CommonPrefixes", []):
            version = prefix_obj["Prefix"].rstrip("/").split("/")[-1]
            versions.append(version)

        return sorted(versions)


class MetadataStore:
    """PostgreSQL-based metadata storage."""

    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Connect to PostgreSQL."""
        self._pool = await asyncpg.create_pool(self.dsn, min_size=2, max_size=10)
        await self._create_tables()

    async def close(self) -> None:
        """Close PostgreSQL connection."""
        if self._pool:
            await self._pool.close()

    async def _create_tables(self) -> None:
        """Create registry tables."""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS model_versions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    model_id INT REFERENCES models(id) ON DELETE CASCADE,
                    version VARCHAR(50) NOT NULL,
                    stage VARCHAR(50) NOT NULL DEFAULT 'development',
                    framework VARCHAR(50) NOT NULL,
                    artifact_path VARCHAR(500) NOT NULL,
                    artifact_size BIGINT NOT NULL,
                    checksum VARCHAR(64) NOT NULL,
                    metadata JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    promoted_at TIMESTAMP,
                    promoted_by VARCHAR(255),
                    UNIQUE(model_id, version)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS model_lineage (
                    id SERIAL PRIMARY KEY,
                    model_version_id UUID REFERENCES model_versions(id),
                    parent_version_id UUID REFERENCES model_versions(id),
                    relationship VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS deployment_history (
                    id SERIAL PRIMARY KEY,
                    model_version_id UUID REFERENCES model_versions(id),
                    from_stage VARCHAR(50),
                    to_stage VARCHAR(50) NOT NULL,
                    promoted_by VARCHAR(255),
                    reason TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_model_versions_stage
                ON model_versions (stage, model_id)
            """)

    async def register_model(self, name: str, description: str = "") -> int:
        """Register a new model."""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO models (name, description)
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET
                    description = EXCLUDED.description,
                    updated_at = NOW()
                RETURNING id
            """, name, description)
            return row["id"]

    async def create_version(
        self,
        model_id: int,
        version: str,
        framework: ModelFramework,
        artifact_path: str,
        artifact_size: int,
        checksum: str,
        metadata: ModelMetadata,
    ) -> str:
        """Create a new model version."""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO model_versions
                (model_id, version, framework, artifact_path, artifact_size, checksum, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            """, model_id, version, framework.value, artifact_path,
               artifact_size, checksum, metadata.model_dump_json())
            return str(row["id"])

    async def get_version(
        self,
        name: str,
        version: str | None = None,
        stage: ModelStage | None = None,
    ) -> ModelVersion | None:
        """Get model version by name and version or stage."""
        async with self._pool.acquire() as conn:
            if version:
                row = await conn.fetchrow("""
                    SELECT mv.*, m.name as model_name
                    FROM model_versions mv
                    JOIN models m ON mv.model_id = m.id
                    WHERE m.name = $1 AND mv.version = $2
                """, name, version)
            elif stage:
                row = await conn.fetchrow("""
                    SELECT mv.*, m.name as model_name
                    FROM model_versions mv
                    JOIN models m ON mv.model_id = m.id
                    WHERE m.name = $1 AND mv.stage = $2
                    ORDER BY mv.created_at DESC
                    LIMIT 1
                """, name, stage.value)
            else:
                row = await conn.fetchrow("""
                    SELECT mv.*, m.name as model_name
                    FROM model_versions mv
                    JOIN models m ON mv.model_id = m.id
                    WHERE m.name = $1
                    ORDER BY mv.created_at DESC
                    LIMIT 1
                """, name)

            if not row:
                return None

            metadata = ModelMetadata(**json.loads(row["metadata"]))

            return ModelVersion(
                id=str(row["id"]),
                name=row["model_name"],
                version=row["version"],
                stage=ModelStage(row["stage"]),
                framework=ModelFramework(row["framework"]),
                artifact_path=row["artifact_path"],
                artifact_size=row["artifact_size"],
                checksum=row["checksum"],
                metadata=metadata,
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                promoted_at=row["promoted_at"],
                promoted_by=row["promoted_by"],
            )

    async def list_versions(
        self,
        name: str,
        stage: ModelStage | None = None,
    ) -> list[ModelVersion]:
        """List all versions of a model."""
        async with self._pool.acquire() as conn:
            if stage:
                rows = await conn.fetch("""
                    SELECT mv.*, m.name as model_name
                    FROM model_versions mv
                    JOIN models m ON mv.model_id = m.id
                    WHERE m.name = $1 AND mv.stage = $2
                    ORDER BY mv.created_at DESC
                """, name, stage.value)
            else:
                rows = await conn.fetch("""
                    SELECT mv.*, m.name as model_name
                    FROM model_versions mv
                    JOIN models m ON mv.model_id = m.id
                    WHERE m.name = $1
                    ORDER BY mv.created_at DESC
                """, name)

            versions = []
            for row in rows:
                metadata = ModelMetadata(**json.loads(row["metadata"]))
                versions.append(ModelVersion(
                    id=str(row["id"]),
                    name=row["model_name"],
                    version=row["version"],
                    stage=ModelStage(row["stage"]),
                    framework=ModelFramework(row["framework"]),
                    artifact_path=row["artifact_path"],
                    artifact_size=row["artifact_size"],
                    checksum=row["checksum"],
                    metadata=metadata,
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    promoted_at=row["promoted_at"],
                    promoted_by=row["promoted_by"],
                ))

            return versions

    async def promote_version(
        self,
        version_id: str,
        to_stage: ModelStage,
        promoted_by: str,
        reason: str = "",
    ) -> None:
        """Promote model version to a new stage."""
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                # Get current stage
                row = await conn.fetchrow("""
                    SELECT stage FROM model_versions WHERE id = $1
                """, version_id)

                from_stage = row["stage"] if row else None

                # Update version stage
                await conn.execute("""
                    UPDATE model_versions
                    SET stage = $1, promoted_at = NOW(), promoted_by = $2, updated_at = NOW()
                    WHERE id = $3
                """, to_stage.value, promoted_by, version_id)

                # Record in history
                await conn.execute("""
                    INSERT INTO deployment_history
                    (model_version_id, from_stage, to_stage, promoted_by, reason)
                    VALUES ($1, $2, $3, $4, $5)
                """, version_id, from_stage, to_stage.value, promoted_by, reason)

    async def add_lineage(
        self,
        version_id: str,
        parent_version_id: str,
        relationship: str = "derived_from",
    ) -> None:
        """Add lineage relationship between versions."""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO model_lineage
                (model_version_id, parent_version_id, relationship)
                VALUES ($1, $2, $3)
            """, version_id, parent_version_id, relationship)


class ModelRegistry:
    """Unified model registry interface."""

    def __init__(
        self,
        artifact_store: ArtifactStore,
        metadata_store: MetadataStore,
    ):
        self.artifacts = artifact_store
        self.metadata = metadata_store

    async def connect(self) -> None:
        """Connect to metadata store."""
        await self.metadata.connect()

    async def close(self) -> None:
        """Close connections."""
        await self.metadata.close()

    async def register_model(
        self,
        name: str,
        version: str,
        artifact_path: Path | str,
        framework: ModelFramework,
        description: str = "",
        metrics: dict[str, float] | None = None,
        parameters: dict[str, Any] | None = None,
        tags: dict[str, str] | None = None,
        created_by: str | None = None,
    ) -> ModelVersion:
        """Register a new model version.

        Args:
            name: Model name
            version: Semantic version string
            artifact_path: Path to model artifact
            framework: ML framework
            description: Model description
            metrics: Training/evaluation metrics
            parameters: Model hyperparameters
            tags: Custom tags
            created_by: User who created the model

        Returns:
            Created ModelVersion
        """
        # Register model if not exists
        model_id = await self.metadata.register_model(name, description)

        # Upload artifact
        s3_key, size, checksum = self.artifacts.upload_artifact(
            name, version, artifact_path
        )

        # Create metadata
        metadata = ModelMetadata(
            name=name,
            version=version,
            framework=framework,
            description=description,
            metrics=metrics or {},
            parameters=parameters or {},
            tags=tags or {},
            created_by=created_by,
        )

        # Create version record
        version_id = await self.metadata.create_version(
            model_id=model_id,
            version=version,
            framework=framework,
            artifact_path=s3_key,
            artifact_size=size,
            checksum=checksum,
            metadata=metadata,
        )

        return await self.metadata.get_version(name, version)

    async def get_model(
        self,
        name: str,
        version: str | None = None,
        stage: ModelStage | None = None,
    ) -> ModelVersion | None:
        """Get model version by name and version/stage."""
        return await self.metadata.get_version(name, version, stage)

    async def get_production_model(self, name: str) -> ModelVersion | None:
        """Get the production version of a model."""
        return await self.metadata.get_version(
            name, stage=ModelStage.PRODUCTION
        )

    async def download_model(
        self,
        name: str,
        version: str | None = None,
        stage: ModelStage | None = None,
        destination: Path | str | None = None,
    ) -> Path:
        """Download model artifact.

        Args:
            name: Model name
            version: Specific version
            stage: Or stage to download
            destination: Local destination path

        Returns:
            Path to downloaded artifact
        """
        model = await self.get_model(name, version, stage)
        if not model:
            raise ValueError(f"Model not found: {name}")

        if destination is None:
            destination = Path(f"./{name}-{model.version}")

        return self.artifacts.download_artifact(
            model.artifact_path,
            destination,
        )

    async def promote(
        self,
        name: str,
        version: str,
        to_stage: ModelStage,
        promoted_by: str,
        reason: str = "",
    ) -> ModelVersion:
        """Promote model to a new stage.

        Args:
            name: Model name
            version: Version to promote
            to_stage: Target stage
            promoted_by: User performing promotion
            reason: Reason for promotion

        Returns:
            Updated ModelVersion
        """
        model = await self.get_model(name, version)
        if not model:
            raise ValueError(f"Model not found: {name} v{version}")

        await self.metadata.promote_version(
            model.id, to_stage, promoted_by, reason
        )

        return await self.get_model(name, version)

    async def list_models(self) -> list[str]:
        """List all registered model names."""
        async with self.metadata._pool.acquire() as conn:
            rows = await conn.fetch("SELECT name FROM models ORDER BY name")
            return [row["name"] for row in rows]

    async def list_versions(
        self,
        name: str,
        stage: ModelStage | None = None,
    ) -> list[ModelVersion]:
        """List all versions of a model."""
        return await self.metadata.list_versions(name, stage)

    def get_download_url(
        self,
        model: ModelVersion,
        expiration: int = 3600,
    ) -> str:
        """Get presigned URL for model download."""
        return self.artifacts.generate_presigned_url(
            model.artifact_path, expiration
        )


# Usage example
async def main():
    # Initialize registry
    artifacts = ArtifactStore(
        bucket="ml-models",
        prefix="registry",
    )
    metadata = MetadataStore("postgresql://localhost/model_registry")

    registry = ModelRegistry(artifacts, metadata)
    await registry.connect()

    # Register a model
    model = await registry.register_model(
        name="fraud-detector",
        version="1.0.0",
        artifact_path="./model.pt",
        framework=ModelFramework.PYTORCH,
        description="Fraud detection model",
        metrics={"accuracy": 0.95, "f1": 0.92},
        parameters={"hidden_size": 256, "num_layers": 3},
        tags={"team": "ml", "use_case": "fraud"},
        created_by="ml-engineer@example.com",
    )

    print(f"Registered: {model.name} v{model.version}")

    # Promote to staging
    model = await registry.promote(
        name="fraud-detector",
        version="1.0.0",
        to_stage=ModelStage.STAGING,
        promoted_by="ml-lead@example.com",
        reason="Passed all validation tests",
    )

    print(f"Promoted to: {model.stage}")

    # Get production model
    prod_model = await registry.get_production_model("fraud-detector")
    if prod_model:
        print(f"Production: v{prod_model.version}")

    await registry.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## FastAPI Registry API

```python
# model_registry/api.py
"""REST API for model registry."""
from datetime import datetime
from typing import Any
from pathlib import Path
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from .core import (
    ModelRegistry,
    ModelVersion,
    ModelStage,
    ModelFramework,
    ArtifactStore,
    MetadataStore,
)


app = FastAPI(title="Model Registry API", version="1.0.0")


# Request/Response models
class RegisterModelRequest(BaseModel):
    name: str
    version: str
    framework: ModelFramework
    description: str = ""
    metrics: dict[str, float] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    tags: dict[str, str] = Field(default_factory=dict)


class PromoteRequest(BaseModel):
    to_stage: ModelStage
    promoted_by: str
    reason: str = ""


class ModelResponse(BaseModel):
    id: str
    name: str
    version: str
    stage: ModelStage
    framework: ModelFramework
    artifact_size: int
    checksum: str
    metrics: dict[str, float]
    parameters: dict[str, Any]
    tags: dict[str, str]
    created_at: datetime
    promoted_at: datetime | None


# Dependencies
async def get_registry() -> ModelRegistry:
    """Get registry instance."""
    # In production, use proper dependency injection
    artifacts = ArtifactStore(bucket="ml-models")
    metadata = MetadataStore("postgresql://localhost/model_registry")
    registry = ModelRegistry(artifacts, metadata)
    await registry.connect()
    return registry


@app.get("/models", response_model=list[str])
async def list_models(
    registry: ModelRegistry = Depends(get_registry),
):
    """List all registered models."""
    return await registry.list_models()


@app.get("/models/{name}/versions", response_model=list[ModelResponse])
async def list_versions(
    name: str,
    stage: ModelStage | None = None,
    registry: ModelRegistry = Depends(get_registry),
):
    """List versions of a model."""
    versions = await registry.list_versions(name, stage)

    return [
        ModelResponse(
            id=v.id,
            name=v.name,
            version=v.version,
            stage=v.stage,
            framework=v.framework,
            artifact_size=v.artifact_size,
            checksum=v.checksum,
            metrics=v.metadata.metrics,
            parameters=v.metadata.parameters,
            tags=v.metadata.tags,
            created_at=v.created_at,
            promoted_at=v.promoted_at,
        )
        for v in versions
    ]


@app.get("/models/{name}/latest", response_model=ModelResponse)
async def get_latest(
    name: str,
    stage: ModelStage | None = Query(None),
    registry: ModelRegistry = Depends(get_registry),
):
    """Get latest model version."""
    model = await registry.get_model(name, stage=stage)

    if not model:
        raise HTTPException(404, f"Model not found: {name}")

    return ModelResponse(
        id=model.id,
        name=model.name,
        version=model.version,
        stage=model.stage,
        framework=model.framework,
        artifact_size=model.artifact_size,
        checksum=model.checksum,
        metrics=model.metadata.metrics,
        parameters=model.metadata.parameters,
        tags=model.metadata.tags,
        created_at=model.created_at,
        promoted_at=model.promoted_at,
    )


@app.get("/models/{name}/versions/{version}", response_model=ModelResponse)
async def get_version(
    name: str,
    version: str,
    registry: ModelRegistry = Depends(get_registry),
):
    """Get specific model version."""
    model = await registry.get_model(name, version)

    if not model:
        raise HTTPException(404, f"Model not found: {name} v{version}")

    return ModelResponse(
        id=model.id,
        name=model.name,
        version=model.version,
        stage=model.stage,
        framework=model.framework,
        artifact_size=model.artifact_size,
        checksum=model.checksum,
        metrics=model.metadata.metrics,
        parameters=model.metadata.parameters,
        tags=model.metadata.tags,
        created_at=model.created_at,
        promoted_at=model.promoted_at,
    )


@app.post("/models/{name}/versions/{version}", response_model=ModelResponse)
async def register_model(
    name: str,
    version: str,
    artifact: UploadFile = File(...),
    framework: ModelFramework = Query(...),
    description: str = Query(""),
    registry: ModelRegistry = Depends(get_registry),
):
    """Register a new model version with artifact upload."""
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=artifact.filename) as tmp:
        content = await artifact.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        model = await registry.register_model(
            name=name,
            version=version,
            artifact_path=tmp_path,
            framework=framework,
            description=description,
        )

        return ModelResponse(
            id=model.id,
            name=model.name,
            version=model.version,
            stage=model.stage,
            framework=model.framework,
            artifact_size=model.artifact_size,
            checksum=model.checksum,
            metrics=model.metadata.metrics,
            parameters=model.metadata.parameters,
            tags=model.metadata.tags,
            created_at=model.created_at,
            promoted_at=model.promoted_at,
        )
    finally:
        tmp_path.unlink()


@app.post("/models/{name}/versions/{version}/promote", response_model=ModelResponse)
async def promote_model(
    name: str,
    version: str,
    request: PromoteRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """Promote model to a new stage."""
    model = await registry.promote(
        name=name,
        version=version,
        to_stage=request.to_stage,
        promoted_by=request.promoted_by,
        reason=request.reason,
    )

    return ModelResponse(
        id=model.id,
        name=model.name,
        version=model.version,
        stage=model.stage,
        framework=model.framework,
        artifact_size=model.artifact_size,
        checksum=model.checksum,
        metrics=model.metadata.metrics,
        parameters=model.metadata.parameters,
        tags=model.metadata.tags,
        created_at=model.created_at,
        promoted_at=model.promoted_at,
    )


@app.get("/models/{name}/versions/{version}/download")
async def download_model(
    name: str,
    version: str,
    registry: ModelRegistry = Depends(get_registry),
):
    """Get presigned URL for model download."""
    model = await registry.get_model(name, version)

    if not model:
        raise HTTPException(404, f"Model not found: {name} v{version}")

    url = registry.get_download_url(model)
    return RedirectResponse(url)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
```

## Model Loader

```python
# model_registry/loader.py
"""Model loading utilities for different frameworks."""
from pathlib import Path
from typing import Any
import pickle
import json


class ModelLoader:
    """Load models from various frameworks."""

    @staticmethod
    def load_pytorch(path: Path) -> Any:
        """Load PyTorch model."""
        import torch

        return torch.load(path, map_location="cpu")

    @staticmethod
    def load_tensorflow(path: Path) -> Any:
        """Load TensorFlow/Keras model."""
        import tensorflow as tf

        return tf.keras.models.load_model(str(path))

    @staticmethod
    def load_sklearn(path: Path) -> Any:
        """Load scikit-learn model."""
        import joblib

        return joblib.load(path)

    @staticmethod
    def load_xgboost(path: Path) -> Any:
        """Load XGBoost model."""
        import xgboost as xgb

        model = xgb.Booster()
        model.load_model(str(path))
        return model

    @staticmethod
    def load_lightgbm(path: Path) -> Any:
        """Load LightGBM model."""
        import lightgbm as lgb

        return lgb.Booster(model_file=str(path))

    @staticmethod
    def load_onnx(path: Path) -> Any:
        """Load ONNX model for inference."""
        import onnxruntime as ort

        return ort.InferenceSession(str(path))

    @classmethod
    def load(cls, path: Path, framework: str) -> Any:
        """Load model based on framework.

        Args:
            path: Path to model file
            framework: Framework name

        Returns:
            Loaded model object
        """
        loaders = {
            "pytorch": cls.load_pytorch,
            "tensorflow": cls.load_tensorflow,
            "sklearn": cls.load_sklearn,
            "xgboost": cls.load_xgboost,
            "lightgbm": cls.load_lightgbm,
            "onnx": cls.load_onnx,
        }

        loader = loaders.get(framework.lower())
        if not loader:
            raise ValueError(f"Unsupported framework: {framework}")

        return loader(path)


class RegistryModelLoader:
    """Load models directly from registry."""

    def __init__(self, registry: Any):
        self.registry = registry
        self._cache: dict[str, Any] = {}

    async def load(
        self,
        name: str,
        version: str | None = None,
        stage: str | None = None,
        use_cache: bool = True,
    ) -> Any:
        """Load model from registry.

        Args:
            name: Model name
            version: Specific version
            stage: Or stage to load
            use_cache: Use cached model if available

        Returns:
            Loaded model object
        """
        # Get model metadata
        model_version = await self.registry.get_model(name, version, stage)
        if not model_version:
            raise ValueError(f"Model not found: {name}")

        cache_key = f"{name}:{model_version.version}"

        if use_cache and cache_key in self._cache:
            return self._cache[cache_key]

        # Download model
        local_path = await self.registry.download_model(
            name,
            model_version.version,
        )

        # Load model
        model = ModelLoader.load(local_path, model_version.framework.value)

        if use_cache:
            self._cache[cache_key] = model

        return model

    async def load_production(self, name: str) -> Any:
        """Load production model."""
        return await self.load(name, stage="production")
```

## CLAUDE.md Integration

```markdown
# Model Registry Integration

## Commands
- `python -m model_registry.cli register` - Register model
- `python -m model_registry.cli promote` - Promote to stage
- `python -m model_registry.cli download` - Download artifact

## Model Lifecycle
1. Development - Initial model registration
2. Staging - Validation and testing
3. Production - Live serving
4. Archived - Deprecated versions

## Best Practices
- Use semantic versioning (major.minor.patch)
- Include metrics and parameters in metadata
- Add lineage for derived models
- Tag models with team and use case
```

## AI Suggestions

1. **Model comparison UI** - Compare metrics across versions side-by-side
2. **Automatic model validation** - Run validation tests before promotion
3. **Model deprecation workflow** - Automated archival of old versions
4. **Model serving integration** - Direct deployment to serving infrastructure
5. **Model rollback automation** - One-click rollback to previous version
6. **Approval workflows** - Multi-stage approval for production promotion
7. **Model performance tracking** - Track inference latency and throughput
8. **Model drift detection** - Monitor for data and concept drift
9. **A/B deployment support** - Shadow deployment and traffic splitting
10. **Audit logging** - Complete audit trail of all registry operations
