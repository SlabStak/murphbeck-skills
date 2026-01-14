# Feature Store Templates

Production-ready feature store implementations for ML feature management, online/offline serving, and feature pipelines.

## Overview

- **Feast Feature Store**: Open-source feature store with offline/online serving
- **Custom Feature Store**: Redis + PostgreSQL feature store implementation
- **Feature Registry**: Centralized feature metadata and versioning
- **Feature Pipelines**: Batch and streaming feature computation

## Quick Start

```bash
# Install Feast
pip install feast feast-redis feast-snowflake

# Initialize feature repository
feast init my_feature_repo
cd my_feature_repo

# Apply feature definitions
feast apply

# Materialize features to online store
feast materialize-incremental $(date +%Y-%m-%d)
```

## Feast Feature Store

```python
# feature_repo/feature_definitions.py
"""Feast feature definitions."""
from datetime import timedelta
from feast import (
    Entity,
    Feature,
    FeatureView,
    FeatureService,
    FileSource,
    PushSource,
    Field,
    ValueType,
)
from feast.types import Float32, Int64, String
from feast.on_demand_feature_view import on_demand_feature_view
import pandas as pd


# Define entities
customer = Entity(
    name="customer",
    join_keys=["customer_id"],
    description="Customer entity for feature retrieval",
)

product = Entity(
    name="product",
    join_keys=["product_id"],
    description="Product entity",
)

# Define data sources
customer_stats_source = FileSource(
    name="customer_stats_source",
    path="data/customer_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp",
)

transactions_source = FileSource(
    name="transactions_source",
    path="data/transactions.parquet",
    timestamp_field="transaction_timestamp",
)

# Push source for real-time features
realtime_source = PushSource(
    name="realtime_customer_activity",
    batch_source=customer_stats_source,
)

# Feature views
customer_stats_fv = FeatureView(
    name="customer_stats",
    entities=[customer],
    ttl=timedelta(days=1),
    schema=[
        Field(name="total_purchases", dtype=Int64),
        Field(name="avg_purchase_amount", dtype=Float32),
        Field(name="purchase_count_30d", dtype=Int64),
        Field(name="last_purchase_amount", dtype=Float32),
        Field(name="customer_segment", dtype=String),
    ],
    source=customer_stats_source,
    online=True,
    tags={"team": "ml-platform"},
)

transaction_stats_fv = FeatureView(
    name="transaction_stats",
    entities=[customer],
    ttl=timedelta(hours=1),
    schema=[
        Field(name="transaction_count_1h", dtype=Int64),
        Field(name="transaction_amount_1h", dtype=Float32),
        Field(name="avg_transaction_1h", dtype=Float32),
    ],
    source=transactions_source,
    online=True,
)

# On-demand feature view for real-time transformations
@on_demand_feature_view(
    sources=[customer_stats_fv],
    schema=[
        Field(name="purchase_frequency_score", dtype=Float32),
        Field(name="high_value_customer", dtype=Int64),
    ],
)
def customer_derived_features(inputs: pd.DataFrame) -> pd.DataFrame:
    """Compute derived features on-demand."""
    df = pd.DataFrame()

    # Calculate purchase frequency score
    df["purchase_frequency_score"] = (
        inputs["purchase_count_30d"] / 30.0
    ).clip(0, 1)

    # High value customer flag
    df["high_value_customer"] = (
        inputs["avg_purchase_amount"] > 100
    ).astype(int)

    return df


# Feature service for model serving
fraud_detection_service = FeatureService(
    name="fraud_detection",
    features=[
        customer_stats_fv,
        transaction_stats_fv,
        customer_derived_features,
    ],
    description="Features for fraud detection model",
    tags={"model": "fraud_v2"},
)

recommendation_service = FeatureService(
    name="recommendation",
    features=[
        customer_stats_fv[["total_purchases", "customer_segment"]],
        customer_derived_features,
    ],
    description="Features for recommendation model",
)
```

```python
# feature_store_client.py
"""Feast feature store client for training and serving."""
from datetime import datetime, timedelta
from typing import Any
import pandas as pd
from feast import FeatureStore
from feast.infra.online_stores.redis import RedisOnlineStore


class FeatureStoreClient:
    """Client for interacting with Feast feature store."""

    def __init__(self, repo_path: str = "."):
        self.store = FeatureStore(repo_path=repo_path)

    def get_training_data(
        self,
        entity_df: pd.DataFrame,
        feature_service: str,
        full_feature_names: bool = True,
    ) -> pd.DataFrame:
        """Get historical features for training.

        Args:
            entity_df: DataFrame with entity keys and timestamps
            feature_service: Name of feature service
            full_feature_names: Include feature view name in column names

        Returns:
            DataFrame with entity data joined with features
        """
        training_df = self.store.get_historical_features(
            entity_df=entity_df,
            features=self.store.get_feature_service(feature_service),
            full_feature_names=full_feature_names,
        ).to_df()

        return training_df

    def get_online_features(
        self,
        entity_rows: list[dict[str, Any]],
        feature_service: str,
    ) -> dict[str, list[Any]]:
        """Get online features for inference.

        Args:
            entity_rows: List of entity key dictionaries
            feature_service: Name of feature service

        Returns:
            Dictionary of feature name to values
        """
        feature_vector = self.store.get_online_features(
            features=self.store.get_feature_service(feature_service),
            entity_rows=entity_rows,
        )

        return feature_vector.to_dict()

    def push_features(
        self,
        push_source_name: str,
        df: pd.DataFrame,
    ) -> None:
        """Push real-time features to online store.

        Args:
            push_source_name: Name of push source
            df: DataFrame with features to push
        """
        self.store.push(
            push_source_name=push_source_name,
            df=df,
            to=PushMode.ONLINE_AND_OFFLINE,
        )

    def materialize(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        feature_views: list[str] | None = None,
    ) -> None:
        """Materialize features to online store.

        Args:
            start_date: Start of materialization window
            end_date: End of materialization window
            feature_views: Specific feature views to materialize
        """
        if end_date is None:
            end_date = datetime.utcnow()
        if start_date is None:
            start_date = end_date - timedelta(days=1)

        self.store.materialize(
            start_date=start_date,
            end_date=end_date,
            feature_views=feature_views,
        )

    def get_feature_metadata(self, feature_view: str) -> dict[str, Any]:
        """Get metadata for a feature view."""
        fv = self.store.get_feature_view(feature_view)

        return {
            "name": fv.name,
            "entities": [e.name for e in fv.entities],
            "features": [f.name for f in fv.features],
            "ttl": str(fv.ttl),
            "online": fv.online,
            "tags": fv.tags,
        }


# Usage example
if __name__ == "__main__":
    client = FeatureStoreClient("feature_repo")

    # Create entity DataFrame for training
    entity_df = pd.DataFrame({
        "customer_id": ["C001", "C002", "C003"],
        "event_timestamp": [
            datetime(2024, 1, 15),
            datetime(2024, 1, 15),
            datetime(2024, 1, 15),
        ],
    })

    # Get training data
    training_data = client.get_training_data(
        entity_df=entity_df,
        feature_service="fraud_detection",
    )
    print("Training data shape:", training_data.shape)

    # Get online features
    online_features = client.get_online_features(
        entity_rows=[{"customer_id": "C001"}],
        feature_service="fraud_detection",
    )
    print("Online features:", online_features)
```

## Custom Feature Store Implementation

```python
# custom_feature_store.py
"""Custom feature store with Redis online store and PostgreSQL offline store."""
import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, TypeVar
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import redis.asyncio as redis
import asyncpg
import pandas as pd
from pydantic import BaseModel


class FeatureType(str, Enum):
    """Supported feature data types."""
    INT = "int"
    FLOAT = "float"
    STRING = "string"
    BOOL = "bool"
    LIST_INT = "list_int"
    LIST_FLOAT = "list_float"
    EMBEDDING = "embedding"


@dataclass
class FeatureDefinition:
    """Definition of a single feature."""
    name: str
    dtype: FeatureType
    description: str = ""
    default_value: Any = None
    tags: dict[str, str] = field(default_factory=dict)


@dataclass
class FeatureGroup:
    """Group of related features with same entity."""
    name: str
    entity_key: str
    features: list[FeatureDefinition]
    ttl_seconds: int = 86400
    description: str = ""
    version: int = 1


class OnlineStore:
    """Redis-based online feature store."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._pool: redis.Redis | None = None

    async def connect(self) -> None:
        """Connect to Redis."""
        self._pool = await redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )

    async def close(self) -> None:
        """Close Redis connection."""
        if self._pool:
            await self._pool.close()

    def _make_key(self, group: str, entity_id: str) -> str:
        """Create Redis key for feature group."""
        return f"features:{group}:{entity_id}"

    async def write_features(
        self,
        group: FeatureGroup,
        entity_id: str,
        features: dict[str, Any],
        timestamp: datetime | None = None,
    ) -> None:
        """Write features to online store.

        Args:
            group: Feature group definition
            entity_id: Entity identifier
            features: Feature name to value mapping
            timestamp: Feature timestamp (defaults to now)
        """
        if timestamp is None:
            timestamp = datetime.utcnow()

        key = self._make_key(group.name, entity_id)

        # Add metadata
        data = {
            "_timestamp": timestamp.isoformat(),
            "_version": group.version,
            **features,
        }

        # Write to Redis with TTL
        await self._pool.hset(key, mapping={
            k: json.dumps(v) if isinstance(v, (list, dict)) else str(v)
            for k, v in data.items()
        })
        await self._pool.expire(key, group.ttl_seconds)

    async def read_features(
        self,
        group: FeatureGroup,
        entity_id: str,
        feature_names: list[str] | None = None,
    ) -> dict[str, Any]:
        """Read features from online store.

        Args:
            group: Feature group definition
            entity_id: Entity identifier
            feature_names: Specific features to read (None = all)

        Returns:
            Feature name to value mapping
        """
        key = self._make_key(group.name, entity_id)

        if feature_names:
            values = await self._pool.hmget(key, feature_names)
            result = dict(zip(feature_names, values))
        else:
            result = await self._pool.hgetall(key)

        # Parse values based on feature definitions
        parsed = {}
        feature_map = {f.name: f for f in group.features}

        for name, value in result.items():
            if name.startswith("_"):
                parsed[name] = value
                continue

            if value is None:
                feat_def = feature_map.get(name)
                parsed[name] = feat_def.default_value if feat_def else None
                continue

            feat_def = feature_map.get(name)
            if feat_def:
                parsed[name] = self._parse_value(value, feat_def.dtype)
            else:
                parsed[name] = value

        return parsed

    async def read_batch(
        self,
        group: FeatureGroup,
        entity_ids: list[str],
    ) -> dict[str, dict[str, Any]]:
        """Read features for multiple entities.

        Args:
            group: Feature group definition
            entity_ids: List of entity identifiers

        Returns:
            Entity ID to features mapping
        """
        pipe = self._pool.pipeline()

        for entity_id in entity_ids:
            key = self._make_key(group.name, entity_id)
            pipe.hgetall(key)

        results = await pipe.execute()

        return {
            entity_id: result
            for entity_id, result in zip(entity_ids, results)
        }

    def _parse_value(self, value: str, dtype: FeatureType) -> Any:
        """Parse string value to appropriate type."""
        if dtype == FeatureType.INT:
            return int(value)
        elif dtype == FeatureType.FLOAT:
            return float(value)
        elif dtype == FeatureType.BOOL:
            return value.lower() == "true"
        elif dtype in (FeatureType.LIST_INT, FeatureType.LIST_FLOAT, FeatureType.EMBEDDING):
            return json.loads(value)
        return value


class OfflineStore:
    """PostgreSQL-based offline feature store."""

    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Connect to PostgreSQL."""
        self._pool = await asyncpg.create_pool(self.dsn)
        await self._create_tables()

    async def close(self) -> None:
        """Close PostgreSQL connection."""
        if self._pool:
            await self._pool.close()

    async def _create_tables(self) -> None:
        """Create feature store tables."""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS feature_groups (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    entity_key VARCHAR(255) NOT NULL,
                    version INT NOT NULL DEFAULT 1,
                    schema JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS feature_values (
                    id BIGSERIAL PRIMARY KEY,
                    group_name VARCHAR(255) NOT NULL,
                    entity_id VARCHAR(255) NOT NULL,
                    features JSONB NOT NULL,
                    event_timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_feature_values_lookup
                ON feature_values (group_name, entity_id, event_timestamp DESC)
            """)

    async def register_feature_group(self, group: FeatureGroup) -> None:
        """Register feature group in metadata."""
        schema = {
            "entity_key": group.entity_key,
            "features": [
                {
                    "name": f.name,
                    "dtype": f.dtype.value,
                    "description": f.description,
                    "default_value": f.default_value,
                }
                for f in group.features
            ],
            "ttl_seconds": group.ttl_seconds,
            "description": group.description,
        }

        async with self._pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO feature_groups (name, entity_key, version, schema)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (name) DO UPDATE SET
                    version = EXCLUDED.version,
                    schema = EXCLUDED.schema,
                    updated_at = NOW()
            """, group.name, group.entity_key, group.version, json.dumps(schema))

    async def write_features(
        self,
        group_name: str,
        entity_id: str,
        features: dict[str, Any],
        event_timestamp: datetime,
    ) -> None:
        """Write features to offline store."""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO feature_values (group_name, entity_id, features, event_timestamp)
                VALUES ($1, $2, $3, $4)
            """, group_name, entity_id, json.dumps(features), event_timestamp)

    async def write_batch(
        self,
        group_name: str,
        records: list[tuple[str, dict[str, Any], datetime]],
    ) -> None:
        """Write batch of features to offline store."""
        async with self._pool.acquire() as conn:
            await conn.executemany("""
                INSERT INTO feature_values (group_name, entity_id, features, event_timestamp)
                VALUES ($1, $2, $3, $4)
            """, [
                (group_name, entity_id, json.dumps(features), ts)
                for entity_id, features, ts in records
            ])

    async def get_historical_features(
        self,
        group_name: str,
        entity_timestamps: list[tuple[str, datetime]],
    ) -> pd.DataFrame:
        """Get point-in-time correct historical features.

        Args:
            group_name: Feature group name
            entity_timestamps: List of (entity_id, timestamp) tuples

        Returns:
            DataFrame with features at each point in time
        """
        results = []

        async with self._pool.acquire() as conn:
            for entity_id, ts in entity_timestamps:
                row = await conn.fetchrow("""
                    SELECT features, event_timestamp
                    FROM feature_values
                    WHERE group_name = $1
                        AND entity_id = $2
                        AND event_timestamp <= $3
                    ORDER BY event_timestamp DESC
                    LIMIT 1
                """, group_name, entity_id, ts)

                if row:
                    features = json.loads(row["features"])
                    features["entity_id"] = entity_id
                    features["event_timestamp"] = ts
                    features["feature_timestamp"] = row["event_timestamp"]
                    results.append(features)

        return pd.DataFrame(results)


class FeatureStore:
    """Unified feature store with online and offline capabilities."""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        postgres_dsn: str = "postgresql://localhost/features",
    ):
        self.online = OnlineStore(redis_url)
        self.offline = OfflineStore(postgres_dsn)
        self._groups: dict[str, FeatureGroup] = {}

    async def connect(self) -> None:
        """Connect to both stores."""
        await asyncio.gather(
            self.online.connect(),
            self.offline.connect(),
        )

    async def close(self) -> None:
        """Close all connections."""
        await asyncio.gather(
            self.online.close(),
            self.offline.close(),
        )

    async def register_feature_group(self, group: FeatureGroup) -> None:
        """Register a feature group."""
        self._groups[group.name] = group
        await self.offline.register_feature_group(group)

    async def write_features(
        self,
        group_name: str,
        entity_id: str,
        features: dict[str, Any],
        timestamp: datetime | None = None,
        online: bool = True,
        offline: bool = True,
    ) -> None:
        """Write features to stores.

        Args:
            group_name: Feature group name
            entity_id: Entity identifier
            features: Feature values
            timestamp: Event timestamp
            online: Write to online store
            offline: Write to offline store
        """
        if timestamp is None:
            timestamp = datetime.utcnow()

        group = self._groups.get(group_name)
        if not group:
            raise ValueError(f"Unknown feature group: {group_name}")

        tasks = []

        if online:
            tasks.append(
                self.online.write_features(group, entity_id, features, timestamp)
            )

        if offline:
            tasks.append(
                self.offline.write_features(group_name, entity_id, features, timestamp)
            )

        await asyncio.gather(*tasks)

    async def get_online_features(
        self,
        group_name: str,
        entity_id: str,
        features: list[str] | None = None,
    ) -> dict[str, Any]:
        """Get features from online store."""
        group = self._groups.get(group_name)
        if not group:
            raise ValueError(f"Unknown feature group: {group_name}")

        return await self.online.read_features(group, entity_id, features)

    async def get_training_data(
        self,
        group_name: str,
        entity_timestamps: list[tuple[str, datetime]],
    ) -> pd.DataFrame:
        """Get historical features for training."""
        return await self.offline.get_historical_features(
            group_name,
            entity_timestamps,
        )


# Usage
async def main():
    # Initialize feature store
    store = FeatureStore()
    await store.connect()

    # Define feature group
    user_features = FeatureGroup(
        name="user_features",
        entity_key="user_id",
        features=[
            FeatureDefinition("purchase_count", FeatureType.INT, default_value=0),
            FeatureDefinition("avg_purchase_amount", FeatureType.FLOAT, default_value=0.0),
            FeatureDefinition("user_segment", FeatureType.STRING, default_value="new"),
            FeatureDefinition("user_embedding", FeatureType.EMBEDDING),
        ],
        ttl_seconds=3600,
    )

    await store.register_feature_group(user_features)

    # Write features
    await store.write_features(
        "user_features",
        "user_123",
        {
            "purchase_count": 42,
            "avg_purchase_amount": 89.50,
            "user_segment": "premium",
            "user_embedding": [0.1, 0.2, 0.3] * 128,
        },
    )

    # Get online features
    features = await store.get_online_features("user_features", "user_123")
    print("Online features:", features)

    await store.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## Feature Pipeline

```python
# feature_pipeline.py
"""Feature computation pipeline with batch and streaming support."""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Callable
from dataclasses import dataclass
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import asyncio


@dataclass
class FeatureConfig:
    """Configuration for a computed feature."""
    name: str
    dependencies: list[str]
    compute_fn: Callable[[pd.DataFrame], pd.Series]
    description: str = ""
    window: timedelta | None = None


class FeatureTransformer(ABC):
    """Base class for feature transformations."""

    @abstractmethod
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform input dataframe to add features."""
        pass

    @property
    @abstractmethod
    def output_features(self) -> list[str]:
        """List of features produced by this transformer."""
        pass


class AggregationTransformer(FeatureTransformer):
    """Compute aggregation features over time windows."""

    def __init__(
        self,
        entity_col: str,
        timestamp_col: str,
        value_col: str,
        windows: list[timedelta],
        aggregations: list[str] = ["sum", "mean", "count", "max", "min"],
    ):
        self.entity_col = entity_col
        self.timestamp_col = timestamp_col
        self.value_col = value_col
        self.windows = windows
        self.aggregations = aggregations

    @property
    def output_features(self) -> list[str]:
        features = []
        for window in self.windows:
            window_str = self._window_str(window)
            for agg in self.aggregations:
                features.append(f"{self.value_col}_{agg}_{window_str}")
        return features

    def _window_str(self, window: timedelta) -> str:
        if window.days > 0:
            return f"{window.days}d"
        return f"{window.seconds // 3600}h"

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute aggregations for each entity and window."""
        df = df.copy()
        df[self.timestamp_col] = pd.to_datetime(df[self.timestamp_col])

        result_frames = []

        for entity_id in df[self.entity_col].unique():
            entity_df = df[df[self.entity_col] == entity_id].sort_values(
                self.timestamp_col
            )

            entity_features = {self.entity_col: entity_id}
            latest_ts = entity_df[self.timestamp_col].max()

            for window in self.windows:
                window_str = self._window_str(window)
                window_start = latest_ts - window

                window_data = entity_df[
                    entity_df[self.timestamp_col] >= window_start
                ][self.value_col]

                for agg in self.aggregations:
                    feature_name = f"{self.value_col}_{agg}_{window_str}"
                    if agg == "sum":
                        entity_features[feature_name] = window_data.sum()
                    elif agg == "mean":
                        entity_features[feature_name] = window_data.mean()
                    elif agg == "count":
                        entity_features[feature_name] = len(window_data)
                    elif agg == "max":
                        entity_features[feature_name] = window_data.max()
                    elif agg == "min":
                        entity_features[feature_name] = window_data.min()

            result_frames.append(entity_features)

        return pd.DataFrame(result_frames)


class EmbeddingTransformer(FeatureTransformer):
    """Generate embeddings from text or categorical features."""

    def __init__(
        self,
        input_col: str,
        output_col: str,
        embedding_fn: Callable[[list[str]], np.ndarray],
    ):
        self.input_col = input_col
        self.output_col = output_col
        self.embedding_fn = embedding_fn

    @property
    def output_features(self) -> list[str]:
        return [self.output_col]

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        texts = df[self.input_col].tolist()
        embeddings = self.embedding_fn(texts)
        df[self.output_col] = list(embeddings)
        return df


class FeaturePipeline:
    """Pipeline for computing and storing features."""

    def __init__(
        self,
        transformers: list[FeatureTransformer],
        feature_store: Any = None,
        batch_size: int = 1000,
    ):
        self.transformers = transformers
        self.feature_store = feature_store
        self.batch_size = batch_size

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run all transformers on input data."""
        result = df.copy()

        for transformer in self.transformers:
            transformed = transformer.transform(result)

            # Merge transformed features back
            if len(transformed) == len(result):
                for col in transformer.output_features:
                    if col in transformed.columns:
                        result[col] = transformed[col]
            else:
                # Join on common columns
                common_cols = set(result.columns) & set(transformed.columns)
                common_cols -= set(transformer.output_features)
                if common_cols:
                    result = result.merge(
                        transformed,
                        on=list(common_cols),
                        how="left",
                    )

        return result

    async def run_and_store(
        self,
        df: pd.DataFrame,
        group_name: str,
        entity_col: str,
        timestamp_col: str,
    ) -> pd.DataFrame:
        """Run pipeline and store results in feature store."""
        result = self.run(df)

        if self.feature_store:
            # Store each row
            for _, row in result.iterrows():
                entity_id = row[entity_col]
                timestamp = row[timestamp_col]
                features = {
                    k: v for k, v in row.items()
                    if k not in [entity_col, timestamp_col]
                }

                await self.feature_store.write_features(
                    group_name,
                    str(entity_id),
                    features,
                    timestamp,
                )

        return result


# Streaming feature computation
class StreamingFeatureComputer:
    """Compute features from streaming data."""

    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        self._buffers: dict[str, list[dict]] = {}

    def add_event(self, entity_id: str, event: dict) -> None:
        """Add event to entity buffer."""
        if entity_id not in self._buffers:
            self._buffers[entity_id] = []

        event["_timestamp"] = datetime.utcnow()
        self._buffers[entity_id].append(event)

        # Clean old events
        cutoff = datetime.utcnow() - timedelta(seconds=self.window_seconds)
        self._buffers[entity_id] = [
            e for e in self._buffers[entity_id]
            if e["_timestamp"] > cutoff
        ]

    def compute_features(self, entity_id: str) -> dict[str, Any]:
        """Compute features for entity from buffered events."""
        events = self._buffers.get(entity_id, [])

        if not events:
            return {
                "event_count": 0,
                "last_event_seconds_ago": None,
            }

        now = datetime.utcnow()

        return {
            "event_count": len(events),
            "last_event_seconds_ago": (
                now - events[-1]["_timestamp"]
            ).total_seconds(),
            "events_per_minute": len(events) / (self.window_seconds / 60),
        }


# Example usage
if __name__ == "__main__":
    # Create sample transaction data
    transactions = pd.DataFrame({
        "user_id": ["U1", "U1", "U1", "U2", "U2"],
        "amount": [100, 200, 50, 300, 150],
        "timestamp": pd.date_range("2024-01-01", periods=5, freq="h"),
    })

    # Create pipeline
    pipeline = FeaturePipeline([
        AggregationTransformer(
            entity_col="user_id",
            timestamp_col="timestamp",
            value_col="amount",
            windows=[timedelta(hours=1), timedelta(hours=24)],
            aggregations=["sum", "mean", "count"],
        ),
    ])

    # Run pipeline
    features = pipeline.run(transactions)
    print(features)
```

## CLAUDE.md Integration

```markdown
# Feature Store Integration

## Commands
- `feast apply` - Apply feature definitions
- `feast materialize` - Materialize to online store
- `feast ui` - Launch Feast UI

## Feature Patterns
- Entity-centric feature organization
- Point-in-time correct joins for training
- TTL-based online store management
- Feature versioning and registry

## Development Workflow
1. Define features in Python
2. Register with feature store
3. Compute batch features via pipeline
4. Materialize to online store
5. Serve via feature service
```

## AI Suggestions

1. **Feature freshness monitoring** - Track feature staleness and alert on delays
2. **Feature lineage tracking** - Record data sources and transformations
3. **Feature statistics** - Compute and track feature distributions
4. **A/B feature testing** - Serve different feature versions to cohorts
5. **Feature backfill** - Efficiently backfill historical features
6. **Cross-feature validation** - Validate feature consistency across entities
7. **Feature catalog UI** - Build searchable feature discovery interface
8. **Feature importance tracking** - Log which features models actually use
9. **Real-time feature joins** - Join streaming and batch features at serving
10. **Feature cost attribution** - Track compute and storage costs per feature
