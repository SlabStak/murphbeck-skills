# MLflow Tracking Template

> Production-ready MLflow configurations for experiment tracking and model management

## Overview

This template provides MLflow configurations with:
- Experiment tracking
- Model registry
- Artifact storage
- Model serving
- Hyperparameter logging

## Quick Start

```bash
# Install MLflow
pip install mlflow boto3 psycopg2-binary

# Start MLflow server
mlflow server \
  --backend-store-uri postgresql://user:pass@localhost/mlflow \
  --default-artifact-root s3://mlflow-artifacts \
  --host 0.0.0.0 \
  --port 5000

# Or simple local setup
mlflow ui --port 5000
```

## Experiment Tracking

```python
# tracking/experiment.py
import mlflow
from mlflow.tracking import MlflowClient
from typing import Dict, Any, Optional, List
import os
from contextlib import contextmanager


class ExperimentTracker:
    """MLflow experiment tracking wrapper."""

    def __init__(
        self,
        tracking_uri: str = None,
        experiment_name: str = "default",
        artifact_location: str = None,
    ):
        self.tracking_uri = tracking_uri or os.environ.get(
            "MLFLOW_TRACKING_URI", "http://localhost:5000"
        )
        mlflow.set_tracking_uri(self.tracking_uri)

        self.client = MlflowClient()
        self.experiment_name = experiment_name

        # Get or create experiment
        experiment = mlflow.get_experiment_by_name(experiment_name)
        if experiment is None:
            self.experiment_id = mlflow.create_experiment(
                experiment_name,
                artifact_location=artifact_location,
            )
        else:
            self.experiment_id = experiment.experiment_id

        mlflow.set_experiment(experiment_name)

    @contextmanager
    def start_run(
        self,
        run_name: str = None,
        tags: Dict[str, str] = None,
        nested: bool = False,
    ):
        """Start a new MLflow run."""
        with mlflow.start_run(
            run_name=run_name,
            nested=nested,
            tags=tags,
        ) as run:
            yield run

    def log_params(self, params: Dict[str, Any]):
        """Log parameters."""
        mlflow.log_params(params)

    def log_param(self, key: str, value: Any):
        """Log a single parameter."""
        mlflow.log_param(key, value)

    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        """Log metrics."""
        mlflow.log_metrics(metrics, step=step)

    def log_metric(self, key: str, value: float, step: int = None):
        """Log a single metric."""
        mlflow.log_metric(key, value, step=step)

    def log_artifact(self, local_path: str, artifact_path: str = None):
        """Log an artifact file."""
        mlflow.log_artifact(local_path, artifact_path)

    def log_artifacts(self, local_dir: str, artifact_path: str = None):
        """Log all files in a directory as artifacts."""
        mlflow.log_artifacts(local_dir, artifact_path)

    def log_figure(self, figure, artifact_file: str):
        """Log a matplotlib figure."""
        mlflow.log_figure(figure, artifact_file)

    def log_dict(self, dictionary: Dict, artifact_file: str):
        """Log a dictionary as JSON."""
        mlflow.log_dict(dictionary, artifact_file)

    def log_model(
        self,
        model,
        artifact_path: str,
        registered_model_name: str = None,
        **kwargs,
    ):
        """Log a model."""
        # Detect model type and use appropriate logger
        if hasattr(model, "save_pretrained"):
            # HuggingFace Transformers
            mlflow.transformers.log_model(
                model,
                artifact_path,
                registered_model_name=registered_model_name,
                **kwargs,
            )
        elif hasattr(model, "predict"):
            # Scikit-learn style
            mlflow.sklearn.log_model(
                model,
                artifact_path,
                registered_model_name=registered_model_name,
                **kwargs,
            )
        else:
            # PyTorch
            mlflow.pytorch.log_model(
                model,
                artifact_path,
                registered_model_name=registered_model_name,
                **kwargs,
            )

    def set_tags(self, tags: Dict[str, str]):
        """Set run tags."""
        mlflow.set_tags(tags)

    def set_tag(self, key: str, value: str):
        """Set a single tag."""
        mlflow.set_tag(key, value)

    def get_run(self, run_id: str):
        """Get run by ID."""
        return self.client.get_run(run_id)

    def search_runs(
        self,
        filter_string: str = "",
        order_by: List[str] = None,
        max_results: int = 100,
    ):
        """Search runs."""
        return mlflow.search_runs(
            experiment_ids=[self.experiment_id],
            filter_string=filter_string,
            order_by=order_by or ["metrics.accuracy DESC"],
            max_results=max_results,
        )

    def get_best_run(
        self,
        metric: str = "accuracy",
        ascending: bool = False,
    ):
        """Get the best run by metric."""
        order = "ASC" if ascending else "DESC"
        runs = self.search_runs(
            order_by=[f"metrics.{metric} {order}"],
            max_results=1,
        )
        if len(runs) > 0:
            return runs.iloc[0]
        return None


# Usage
if __name__ == "__main__":
    tracker = ExperimentTracker(experiment_name="my_experiment")

    with tracker.start_run(run_name="training_v1"):
        # Log parameters
        tracker.log_params({
            "learning_rate": 0.001,
            "batch_size": 32,
            "epochs": 10,
        })

        # Simulate training
        for epoch in range(10):
            loss = 1.0 / (epoch + 1)
            accuracy = 0.5 + 0.05 * epoch
            tracker.log_metrics({
                "loss": loss,
                "accuracy": accuracy,
            }, step=epoch)

        # Log model
        # tracker.log_model(model, "model")
```

## Auto-logging

```python
# tracking/autolog.py
import mlflow
from mlflow import MlflowClient


def setup_autolog(
    framework: str = "sklearn",
    log_models: bool = True,
    log_input_examples: bool = True,
    log_model_signatures: bool = True,
    log_datasets: bool = True,
):
    """Setup automatic logging for ML frameworks."""
    common_kwargs = {
        "log_models": log_models,
        "log_input_examples": log_input_examples,
        "log_model_signatures": log_model_signatures,
    }

    if framework == "sklearn":
        mlflow.sklearn.autolog(**common_kwargs)
    elif framework == "pytorch":
        mlflow.pytorch.autolog(**common_kwargs)
    elif framework == "tensorflow":
        mlflow.tensorflow.autolog(**common_kwargs)
    elif framework == "keras":
        mlflow.keras.autolog(**common_kwargs)
    elif framework == "xgboost":
        mlflow.xgboost.autolog(**common_kwargs)
    elif framework == "lightgbm":
        mlflow.lightgbm.autolog(**common_kwargs)
    elif framework == "transformers":
        mlflow.transformers.autolog(**common_kwargs)
    else:
        raise ValueError(f"Unknown framework: {framework}")


# Example with sklearn
def train_sklearn_model():
    """Train a model with autologging."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.datasets import load_iris
    from sklearn.model_selection import train_test_split

    # Enable autologging
    setup_autolog("sklearn")

    # Load data
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2
    )

    # Train model - automatically logged
    with mlflow.start_run():
        model = RandomForestClassifier(n_estimators=100, max_depth=5)
        model.fit(X_train, y_train)

        # Evaluate - automatically logged
        score = model.score(X_test, y_test)
        print(f"Accuracy: {score}")


# Example with PyTorch
def train_pytorch_model():
    """Train a PyTorch model with autologging."""
    import torch
    import torch.nn as nn
    import torch.optim as optim

    setup_autolog("pytorch")

    # Simple model
    model = nn.Sequential(
        nn.Linear(10, 50),
        nn.ReLU(),
        nn.Linear(50, 2),
    )

    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    with mlflow.start_run():
        # Training loop
        for epoch in range(10):
            # Dummy data
            X = torch.randn(32, 10)
            y = torch.randint(0, 2, (32,))

            optimizer.zero_grad()
            outputs = model(X)
            loss = criterion(outputs, y)
            loss.backward()
            optimizer.step()

            mlflow.log_metric("loss", loss.item(), step=epoch)
```

## Model Registry

```python
# registry/model_registry.py
import mlflow
from mlflow.tracking import MlflowClient
from mlflow.entities.model_registry import ModelVersion
from typing import List, Optional
import time


class ModelRegistry:
    """MLflow Model Registry wrapper."""

    def __init__(self, tracking_uri: str = None):
        self.tracking_uri = tracking_uri or "http://localhost:5000"
        mlflow.set_tracking_uri(self.tracking_uri)
        self.client = MlflowClient()

    def register_model(
        self,
        model_uri: str,
        name: str,
        tags: dict = None,
    ) -> ModelVersion:
        """Register a model."""
        result = mlflow.register_model(model_uri, name)

        if tags:
            for key, value in tags.items():
                self.client.set_model_version_tag(
                    name, result.version, key, value
                )

        return result

    def get_latest_versions(
        self,
        name: str,
        stages: List[str] = None,
    ) -> List[ModelVersion]:
        """Get latest model versions."""
        return self.client.get_latest_versions(name, stages=stages)

    def transition_stage(
        self,
        name: str,
        version: str,
        stage: str,
        archive_existing: bool = True,
    ):
        """Transition model to a stage."""
        self.client.transition_model_version_stage(
            name=name,
            version=version,
            stage=stage,
            archive_existing_versions=archive_existing,
        )

    def set_model_description(self, name: str, description: str):
        """Set model description."""
        self.client.update_registered_model(name, description=description)

    def set_version_description(
        self,
        name: str,
        version: str,
        description: str,
    ):
        """Set version description."""
        self.client.update_model_version(
            name, version, description=description
        )

    def delete_model(self, name: str):
        """Delete a registered model."""
        self.client.delete_registered_model(name)

    def delete_version(self, name: str, version: str):
        """Delete a model version."""
        self.client.delete_model_version(name, version)

    def load_model(
        self,
        name: str,
        stage: str = "Production",
        version: str = None,
    ):
        """Load a model from registry."""
        if version:
            model_uri = f"models:/{name}/{version}"
        else:
            model_uri = f"models:/{name}/{stage}"

        return mlflow.pyfunc.load_model(model_uri)

    def search_models(
        self,
        filter_string: str = "",
        max_results: int = 100,
    ):
        """Search registered models."""
        return self.client.search_registered_models(
            filter_string=filter_string,
            max_results=max_results,
        )


# Model promotion workflow
class ModelPromotion:
    """Model promotion workflow."""

    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    def promote_to_staging(
        self,
        name: str,
        version: str,
        run_tests: bool = True,
    ):
        """Promote model to staging."""
        if run_tests:
            # Load and test model
            model = self.registry.load_model(name, version=version)
            self._run_tests(model)

        self.registry.transition_stage(name, version, "Staging")
        print(f"Model {name} v{version} promoted to Staging")

    def promote_to_production(
        self,
        name: str,
        version: str,
        approval_required: bool = True,
    ):
        """Promote model to production."""
        if approval_required:
            # In practice, integrate with approval system
            print(f"Approval required for {name} v{version}")

        self.registry.transition_stage(
            name, version, "Production", archive_existing=True
        )
        print(f"Model {name} v{version} promoted to Production")

    def rollback(self, name: str, target_version: str):
        """Rollback to a previous version."""
        self.registry.transition_stage(
            name, target_version, "Production", archive_existing=True
        )
        print(f"Rolled back {name} to v{target_version}")

    def _run_tests(self, model):
        """Run model tests."""
        # Implement your test logic
        pass


# Usage
if __name__ == "__main__":
    registry = ModelRegistry()

    # Register a model from a run
    model_version = registry.register_model(
        model_uri="runs:/abc123/model",
        name="my_model",
        tags={"team": "ml", "task": "classification"},
    )

    # Promote through stages
    promotion = ModelPromotion(registry)
    promotion.promote_to_staging("my_model", model_version.version)
    promotion.promote_to_production("my_model", model_version.version)
```

## Custom Model Flavor

```python
# flavors/custom_flavor.py
import mlflow
from mlflow.models import Model
from mlflow.models.model import MLMODEL_FILE_NAME
from mlflow.tracking.artifact_utils import _download_artifact_from_uri
import os
import yaml
import cloudpickle


FLAVOR_NAME = "custom_model"


def save_model(
    model,
    path: str,
    conda_env=None,
    code_paths=None,
    signature=None,
    input_example=None,
):
    """Save a custom model."""
    os.makedirs(path, exist_ok=True)

    # Save model artifact
    model_path = os.path.join(path, "model.pkl")
    with open(model_path, "wb") as f:
        cloudpickle.dump(model, f)

    # Save MLmodel file
    mlflow_model = Model(
        artifact_path=path,
        flavors={
            FLAVOR_NAME: {"model_path": "model.pkl"},
            "python_function": {
                "loader_module": __name__,
                "python_model": "model.pkl",
            },
        },
        signature=signature,
        input_example=input_example,
    )
    mlflow_model.save(os.path.join(path, MLMODEL_FILE_NAME))


def load_model(model_uri: str):
    """Load a custom model."""
    local_path = _download_artifact_from_uri(model_uri)
    model_path = os.path.join(local_path, "model.pkl")

    with open(model_path, "rb") as f:
        return cloudpickle.load(f)


def log_model(
    model,
    artifact_path: str,
    registered_model_name: str = None,
    signature=None,
    input_example=None,
):
    """Log a custom model."""
    return Model.log(
        artifact_path=artifact_path,
        flavor=mlflow.pyfunc,
        registered_model_name=registered_model_name,
        signature=signature,
        input_example=input_example,
        python_model=model,
    )
```

## Server Configuration

```yaml
# config/mlflow-server.yaml
# Docker Compose for MLflow server

version: '3.8'

services:
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10.0
    ports:
      - "5000:5000"
    environment:
      - MLFLOW_BACKEND_STORE_URI=postgresql://mlflow:mlflow@postgres:5432/mlflow
      - MLFLOW_DEFAULT_ARTIFACT_ROOT=s3://mlflow-artifacts/
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    command: >
      mlflow server
      --backend-store-uri postgresql://mlflow:mlflow@postgres:5432/mlflow
      --default-artifact-root s3://mlflow-artifacts/
      --host 0.0.0.0
      --port 5000
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=mlflow
      - POSTGRES_PASSWORD=mlflow
      - POSTGRES_DB=mlflow
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## CLAUDE.md Integration

```markdown
# MLflow Tracking

## Components
- **Tracking** - Log params, metrics, artifacts
- **Registry** - Model versioning and staging
- **Projects** - Reproducible runs
- **Models** - Model packaging

## Stages
- `None` - Just registered
- `Staging` - Testing/validation
- `Production` - Live serving
- `Archived` - Deprecated

## Best Practices
- Use autologging when available
- Register models for production
- Track hyperparameters and metrics
- Version data alongside models
```

## AI Suggestions

1. **Enable autologging** - Automatic metric capture
2. **Use model registry** - Version and stage models
3. **Implement promotion workflow** - Staging to production
4. **Configure artifact storage** - S3 or GCS
5. **Add model signatures** - Input/output schema
6. **Track datasets** - Data versioning
7. **Implement A/B testing** - Compare model versions
8. **Add monitoring** - Track model performance
9. **Configure authentication** - Secure access
10. **Implement rollback** - Quick recovery
