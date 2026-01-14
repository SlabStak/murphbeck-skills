# Training Pipeline Templates

Production-ready ML training pipeline implementations for experiment tracking, distributed training, hyperparameter optimization, and pipeline orchestration.

## Overview

- **Training Pipeline Core**: Modular training pipeline with checkpointing
- **Distributed Training**: PyTorch DDP and DeepSpeed integration
- **Hyperparameter Optimization**: Optuna and Ray Tune integration
- **Pipeline Orchestration**: Prefect and Airflow ML workflows

## Quick Start

```bash
# Install dependencies
pip install torch lightning optuna prefect mlflow wandb

# Run training
python train.py --config configs/experiment.yaml

# Run hyperparameter search
python optimize.py --trials 100
```

## Training Pipeline Core

```python
# training/pipeline.py
"""Core training pipeline with modular components."""
import os
import json
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Generic, TypeVar
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torch.optim import Optimizer
from torch.optim.lr_scheduler import _LRScheduler
import yaml


T = TypeVar("T")


@dataclass
class TrainingConfig:
    """Training configuration."""
    # Model
    model_name: str = "model"
    model_params: dict[str, Any] = field(default_factory=dict)

    # Training
    epochs: int = 10
    batch_size: int = 32
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    gradient_clip: float | None = 1.0
    accumulation_steps: int = 1

    # Data
    train_split: float = 0.8
    val_split: float = 0.1
    num_workers: int = 4

    # Checkpointing
    checkpoint_dir: str = "checkpoints"
    save_every: int = 1
    keep_last: int = 3

    # Logging
    log_every: int = 100
    eval_every: int = 1

    # Device
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    mixed_precision: bool = True

    @classmethod
    def from_yaml(cls, path: str) -> "TrainingConfig":
        """Load config from YAML file."""
        with open(path) as f:
            config = yaml.safe_load(f)
        return cls(**config)

    def to_yaml(self, path: str) -> None:
        """Save config to YAML file."""
        with open(path, "w") as f:
            yaml.dump(self.__dict__, f)


class Callback(ABC):
    """Base callback for training events."""

    def on_train_start(self, trainer: "Trainer") -> None:
        pass

    def on_train_end(self, trainer: "Trainer") -> None:
        pass

    def on_epoch_start(self, trainer: "Trainer", epoch: int) -> None:
        pass

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        pass

    def on_batch_start(self, trainer: "Trainer", batch: Any) -> None:
        pass

    def on_batch_end(self, trainer: "Trainer", batch: Any, loss: float) -> None:
        pass

    def on_validation_start(self, trainer: "Trainer") -> None:
        pass

    def on_validation_end(self, trainer: "Trainer", metrics: dict) -> None:
        pass


class CheckpointCallback(Callback):
    """Save model checkpoints."""

    def __init__(
        self,
        save_dir: str,
        save_every: int = 1,
        keep_last: int = 3,
        save_best: bool = True,
        monitor: str = "val_loss",
        mode: str = "min",
    ):
        self.save_dir = Path(save_dir)
        self.save_every = save_every
        self.keep_last = keep_last
        self.save_best = save_best
        self.monitor = monitor
        self.mode = mode
        self.best_value = float("inf") if mode == "min" else float("-inf")

        self.save_dir.mkdir(parents=True, exist_ok=True)

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        # Save regular checkpoint
        if epoch % self.save_every == 0:
            self._save_checkpoint(trainer, epoch, metrics)
            self._cleanup_old_checkpoints()

        # Save best checkpoint
        if self.save_best and self.monitor in metrics:
            current = metrics[self.monitor]
            is_best = (
                current < self.best_value if self.mode == "min"
                else current > self.best_value
            )
            if is_best:
                self.best_value = current
                self._save_checkpoint(trainer, epoch, metrics, is_best=True)

    def _save_checkpoint(
        self,
        trainer: "Trainer",
        epoch: int,
        metrics: dict,
        is_best: bool = False,
    ) -> None:
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": trainer.model.state_dict(),
            "optimizer_state_dict": trainer.optimizer.state_dict(),
            "metrics": metrics,
            "config": trainer.config.__dict__,
        }

        if trainer.scheduler:
            checkpoint["scheduler_state_dict"] = trainer.scheduler.state_dict()

        if is_best:
            path = self.save_dir / "best.pt"
        else:
            path = self.save_dir / f"checkpoint_epoch_{epoch:04d}.pt"

        torch.save(checkpoint, path)

    def _cleanup_old_checkpoints(self) -> None:
        checkpoints = sorted(self.save_dir.glob("checkpoint_epoch_*.pt"))
        for ckpt in checkpoints[:-self.keep_last]:
            ckpt.unlink()


class EarlyStoppingCallback(Callback):
    """Early stopping based on validation metric."""

    def __init__(
        self,
        monitor: str = "val_loss",
        patience: int = 5,
        mode: str = "min",
        min_delta: float = 1e-4,
    ):
        self.monitor = monitor
        self.patience = patience
        self.mode = mode
        self.min_delta = min_delta
        self.best_value = float("inf") if mode == "min" else float("-inf")
        self.counter = 0

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        if self.monitor not in metrics:
            return

        current = metrics[self.monitor]

        if self.mode == "min":
            improved = current < (self.best_value - self.min_delta)
        else:
            improved = current > (self.best_value + self.min_delta)

        if improved:
            self.best_value = current
            self.counter = 0
        else:
            self.counter += 1

        if self.counter >= self.patience:
            trainer.should_stop = True


class LoggingCallback(Callback):
    """Log training progress."""

    def __init__(self, log_every: int = 100):
        self.log_every = log_every
        self.batch_losses: list[float] = []

    def on_batch_end(self, trainer: "Trainer", batch: Any, loss: float) -> None:
        self.batch_losses.append(loss)

        if len(self.batch_losses) % self.log_every == 0:
            avg_loss = sum(self.batch_losses[-self.log_every:]) / self.log_every
            print(
                f"Epoch {trainer.current_epoch} | "
                f"Batch {len(self.batch_losses)} | "
                f"Loss: {avg_loss:.4f}"
            )

    def on_epoch_start(self, trainer: "Trainer", epoch: int) -> None:
        self.batch_losses = []

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        print(f"Epoch {epoch} completed | Metrics: {metrics}")


class MLflowCallback(Callback):
    """Log to MLflow."""

    def __init__(self, experiment_name: str, run_name: str | None = None):
        import mlflow

        self.mlflow = mlflow
        mlflow.set_experiment(experiment_name)
        self.run = mlflow.start_run(run_name=run_name)

    def on_train_start(self, trainer: "Trainer") -> None:
        self.mlflow.log_params(trainer.config.__dict__)

    def on_batch_end(self, trainer: "Trainer", batch: Any, loss: float) -> None:
        self.mlflow.log_metric("train_loss", loss, step=trainer.global_step)

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        for name, value in metrics.items():
            self.mlflow.log_metric(name, value, step=epoch)

    def on_train_end(self, trainer: "Trainer") -> None:
        self.mlflow.end_run()


class WandBCallback(Callback):
    """Log to Weights & Biases."""

    def __init__(self, project: str, name: str | None = None, **kwargs):
        import wandb

        self.wandb = wandb
        self.run = wandb.init(project=project, name=name, **kwargs)

    def on_train_start(self, trainer: "Trainer") -> None:
        self.wandb.config.update(trainer.config.__dict__)

    def on_batch_end(self, trainer: "Trainer", batch: Any, loss: float) -> None:
        self.wandb.log({"train_loss": loss}, step=trainer.global_step)

    def on_epoch_end(self, trainer: "Trainer", epoch: int, metrics: dict) -> None:
        self.wandb.log(metrics, step=epoch)

    def on_train_end(self, trainer: "Trainer") -> None:
        self.wandb.finish()


class Trainer:
    """Main training loop orchestrator."""

    def __init__(
        self,
        model: nn.Module,
        config: TrainingConfig,
        optimizer: Optimizer | None = None,
        scheduler: _LRScheduler | None = None,
        loss_fn: Callable | None = None,
        callbacks: list[Callback] | None = None,
    ):
        self.model = model.to(config.device)
        self.config = config
        self.loss_fn = loss_fn or nn.CrossEntropyLoss()
        self.callbacks = callbacks or []

        # Initialize optimizer
        if optimizer is None:
            self.optimizer = torch.optim.AdamW(
                model.parameters(),
                lr=config.learning_rate,
                weight_decay=config.weight_decay,
            )
        else:
            self.optimizer = optimizer

        self.scheduler = scheduler

        # Training state
        self.current_epoch = 0
        self.global_step = 0
        self.should_stop = False

        # Mixed precision
        self.scaler = torch.amp.GradScaler("cuda") if config.mixed_precision else None

    def fit(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader | None = None,
    ) -> dict[str, Any]:
        """Run training loop.

        Args:
            train_loader: Training data loader
            val_loader: Validation data loader

        Returns:
            Final training metrics
        """
        self._call_callbacks("on_train_start")

        final_metrics = {}

        for epoch in range(1, self.config.epochs + 1):
            if self.should_stop:
                break

            self.current_epoch = epoch
            self._call_callbacks("on_epoch_start", epoch)

            # Training
            train_metrics = self._train_epoch(train_loader)

            # Validation
            val_metrics = {}
            if val_loader and epoch % self.config.eval_every == 0:
                val_metrics = self._validate(val_loader)

            # Combine metrics
            metrics = {**train_metrics, **val_metrics}
            final_metrics = metrics

            self._call_callbacks("on_epoch_end", epoch, metrics)

        self._call_callbacks("on_train_end")

        return final_metrics

    def _train_epoch(self, loader: DataLoader) -> dict[str, float]:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0.0
        num_batches = 0

        for batch_idx, batch in enumerate(loader):
            self._call_callbacks("on_batch_start", batch)

            loss = self._train_step(batch)
            total_loss += loss
            num_batches += 1

            self._call_callbacks("on_batch_end", batch, loss)
            self.global_step += 1

        return {"train_loss": total_loss / num_batches}

    def _train_step(self, batch: tuple) -> float:
        """Single training step."""
        inputs, targets = batch
        inputs = inputs.to(self.config.device)
        targets = targets.to(self.config.device)

        # Forward pass with optional mixed precision
        if self.config.mixed_precision:
            with torch.amp.autocast("cuda"):
                outputs = self.model(inputs)
                loss = self.loss_fn(outputs, targets)
                loss = loss / self.config.accumulation_steps
        else:
            outputs = self.model(inputs)
            loss = self.loss_fn(outputs, targets)
            loss = loss / self.config.accumulation_steps

        # Backward pass
        if self.scaler:
            self.scaler.scale(loss).backward()
        else:
            loss.backward()

        # Optimizer step (with accumulation)
        if (self.global_step + 1) % self.config.accumulation_steps == 0:
            if self.config.gradient_clip:
                if self.scaler:
                    self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(),
                    self.config.gradient_clip,
                )

            if self.scaler:
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                self.optimizer.step()

            self.optimizer.zero_grad()

            if self.scheduler:
                self.scheduler.step()

        return loss.item() * self.config.accumulation_steps

    def _validate(self, loader: DataLoader) -> dict[str, float]:
        """Run validation."""
        self._call_callbacks("on_validation_start")

        self.model.eval()
        total_loss = 0.0
        total_correct = 0
        total_samples = 0

        with torch.no_grad():
            for batch in loader:
                inputs, targets = batch
                inputs = inputs.to(self.config.device)
                targets = targets.to(self.config.device)

                outputs = self.model(inputs)
                loss = self.loss_fn(outputs, targets)

                total_loss += loss.item()

                # Calculate accuracy for classification
                if outputs.dim() > 1:
                    preds = outputs.argmax(dim=-1)
                    total_correct += (preds == targets).sum().item()
                    total_samples += targets.size(0)

        metrics = {"val_loss": total_loss / len(loader)}

        if total_samples > 0:
            metrics["val_accuracy"] = total_correct / total_samples

        self._call_callbacks("on_validation_end", metrics)

        return metrics

    def _call_callbacks(self, method: str, *args, **kwargs) -> None:
        """Call callback methods."""
        for callback in self.callbacks:
            getattr(callback, method)(self, *args, **kwargs)

    def save(self, path: str) -> None:
        """Save trainer state."""
        checkpoint = {
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "epoch": self.current_epoch,
            "global_step": self.global_step,
            "config": self.config.__dict__,
        }
        if self.scheduler:
            checkpoint["scheduler_state_dict"] = self.scheduler.state_dict()
        torch.save(checkpoint, path)

    def load(self, path: str) -> None:
        """Load trainer state."""
        checkpoint = torch.load(path, map_location=self.config.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.current_epoch = checkpoint["epoch"]
        self.global_step = checkpoint["global_step"]
        if self.scheduler and "scheduler_state_dict" in checkpoint:
            self.scheduler.load_state_dict(checkpoint["scheduler_state_dict"])


# Usage example
if __name__ == "__main__":
    # Define model
    model = nn.Sequential(
        nn.Linear(784, 256),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(256, 10),
    )

    # Configure training
    config = TrainingConfig(
        epochs=10,
        batch_size=64,
        learning_rate=1e-3,
        checkpoint_dir="./checkpoints",
    )

    # Create trainer with callbacks
    trainer = Trainer(
        model=model,
        config=config,
        callbacks=[
            LoggingCallback(log_every=50),
            CheckpointCallback(
                save_dir=config.checkpoint_dir,
                save_best=True,
            ),
            EarlyStoppingCallback(patience=3),
        ],
    )

    # Create dummy data loaders
    train_dataset = torch.utils.data.TensorDataset(
        torch.randn(1000, 784),
        torch.randint(0, 10, (1000,)),
    )
    train_loader = DataLoader(train_dataset, batch_size=config.batch_size)

    # Train
    metrics = trainer.fit(train_loader)
    print(f"Final metrics: {metrics}")
```

## Distributed Training

```python
# training/distributed.py
"""Distributed training with PyTorch DDP and DeepSpeed."""
import os
from dataclasses import dataclass
from typing import Any
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler


@dataclass
class DistributedConfig:
    """Distributed training configuration."""
    backend: str = "nccl"  # nccl, gloo, mpi
    world_size: int | None = None  # Auto-detect if None
    local_rank: int | None = None
    master_addr: str = "localhost"
    master_port: str = "29500"


def setup_distributed(config: DistributedConfig) -> int:
    """Initialize distributed process group.

    Returns:
        Local rank of this process
    """
    # Get from environment (set by torchrun/deepspeed)
    local_rank = int(os.environ.get("LOCAL_RANK", config.local_rank or 0))
    world_size = int(os.environ.get("WORLD_SIZE", config.world_size or 1))

    if world_size > 1:
        os.environ["MASTER_ADDR"] = os.environ.get(
            "MASTER_ADDR", config.master_addr
        )
        os.environ["MASTER_PORT"] = os.environ.get(
            "MASTER_PORT", config.master_port
        )

        dist.init_process_group(
            backend=config.backend,
            world_size=world_size,
            rank=local_rank,
        )

        torch.cuda.set_device(local_rank)

    return local_rank


def cleanup_distributed() -> None:
    """Cleanup distributed process group."""
    if dist.is_initialized():
        dist.destroy_process_group()


class DDPTrainer:
    """Trainer with Distributed Data Parallel support."""

    def __init__(
        self,
        model: nn.Module,
        config: Any,
        distributed_config: DistributedConfig,
    ):
        self.local_rank = setup_distributed(distributed_config)
        self.world_size = dist.get_world_size() if dist.is_initialized() else 1
        self.is_main = self.local_rank == 0

        self.config = config
        self.device = torch.device(f"cuda:{self.local_rank}")

        # Wrap model with DDP
        model = model.to(self.device)
        if self.world_size > 1:
            self.model = DDP(
                model,
                device_ids=[self.local_rank],
                output_device=self.local_rank,
                find_unused_parameters=False,
            )
        else:
            self.model = model

        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.learning_rate,
        )

    def get_distributed_loader(
        self,
        dataset: torch.utils.data.Dataset,
        batch_size: int,
        shuffle: bool = True,
    ) -> DataLoader:
        """Create distributed data loader."""
        if self.world_size > 1:
            sampler = DistributedSampler(
                dataset,
                num_replicas=self.world_size,
                rank=self.local_rank,
                shuffle=shuffle,
            )
            shuffle = False
        else:
            sampler = None

        return DataLoader(
            dataset,
            batch_size=batch_size,
            shuffle=shuffle,
            sampler=sampler,
            num_workers=4,
            pin_memory=True,
        )

    def train_epoch(self, loader: DataLoader, epoch: int) -> float:
        """Train for one epoch."""
        self.model.train()

        # Set epoch for sampler
        if hasattr(loader.sampler, "set_epoch"):
            loader.sampler.set_epoch(epoch)

        total_loss = 0.0

        for batch in loader:
            inputs, targets = batch
            inputs = inputs.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            self.optimizer.zero_grad()

            outputs = self.model(inputs)
            loss = nn.functional.cross_entropy(outputs, targets)

            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()

        # Average loss across all processes
        if self.world_size > 1:
            total_loss_tensor = torch.tensor(total_loss, device=self.device)
            dist.all_reduce(total_loss_tensor, op=dist.ReduceOp.SUM)
            total_loss = total_loss_tensor.item() / self.world_size

        return total_loss / len(loader)

    def save_checkpoint(self, path: str, epoch: int) -> None:
        """Save checkpoint (only on main process)."""
        if not self.is_main:
            return

        # Get unwrapped model state
        model_state = (
            self.model.module.state_dict()
            if isinstance(self.model, DDP)
            else self.model.state_dict()
        )

        torch.save({
            "epoch": epoch,
            "model_state_dict": model_state,
            "optimizer_state_dict": self.optimizer.state_dict(),
        }, path)

    def cleanup(self) -> None:
        """Cleanup distributed resources."""
        cleanup_distributed()


# DeepSpeed Training
class DeepSpeedTrainer:
    """Trainer with DeepSpeed support."""

    def __init__(
        self,
        model: nn.Module,
        config: Any,
        deepspeed_config: dict[str, Any],
    ):
        import deepspeed

        self.config = config

        # Initialize DeepSpeed
        self.model, self.optimizer, _, self.scheduler = deepspeed.initialize(
            model=model,
            model_parameters=model.parameters(),
            config=deepspeed_config,
        )

        self.local_rank = self.model.local_rank
        self.device = self.model.device
        self.is_main = self.local_rank == 0

    def train_step(self, batch: tuple) -> float:
        """Single training step with DeepSpeed."""
        inputs, targets = batch
        inputs = inputs.to(self.device)
        targets = targets.to(self.device)

        outputs = self.model(inputs)
        loss = nn.functional.cross_entropy(outputs, targets)

        # DeepSpeed handles backward and optimizer step
        self.model.backward(loss)
        self.model.step()

        return loss.item()

    def save_checkpoint(self, path: str, epoch: int) -> None:
        """Save DeepSpeed checkpoint."""
        self.model.save_checkpoint(path, tag=f"epoch_{epoch}")

    def load_checkpoint(self, path: str) -> None:
        """Load DeepSpeed checkpoint."""
        self.model.load_checkpoint(path)


# DeepSpeed configuration
DEEPSPEED_CONFIG = {
    "train_batch_size": 64,
    "gradient_accumulation_steps": 4,
    "optimizer": {
        "type": "AdamW",
        "params": {
            "lr": 1e-4,
            "betas": [0.9, 0.999],
            "eps": 1e-8,
            "weight_decay": 0.01,
        },
    },
    "scheduler": {
        "type": "WarmupLR",
        "params": {
            "warmup_min_lr": 0,
            "warmup_max_lr": 1e-4,
            "warmup_num_steps": 1000,
        },
    },
    "fp16": {
        "enabled": True,
        "loss_scale": 0,
        "loss_scale_window": 1000,
    },
    "zero_optimization": {
        "stage": 2,
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True,
        },
        "allgather_partitions": True,
        "allgather_bucket_size": 2e8,
        "reduce_scatter": True,
        "reduce_bucket_size": 2e8,
        "overlap_comm": True,
    },
    "gradient_clipping": 1.0,
    "wall_clock_breakdown": False,
}
```

## Hyperparameter Optimization

```python
# training/optimization.py
"""Hyperparameter optimization with Optuna and Ray Tune."""
from dataclasses import dataclass
from typing import Any, Callable
import optuna
from optuna.trial import Trial
from optuna.pruners import MedianPruner
from optuna.samplers import TPESampler
import torch
import torch.nn as nn


@dataclass
class SearchSpace:
    """Hyperparameter search space definition."""
    learning_rate: tuple[float, float] = (1e-5, 1e-2)
    batch_size: list[int] = None
    hidden_size: tuple[int, int] = (64, 512)
    num_layers: tuple[int, int] = (1, 6)
    dropout: tuple[float, float] = (0.0, 0.5)
    optimizer: list[str] = None

    def __post_init__(self):
        if self.batch_size is None:
            self.batch_size = [16, 32, 64, 128]
        if self.optimizer is None:
            self.optimizer = ["adam", "adamw", "sgd"]


class OptunaOptimizer:
    """Hyperparameter optimization with Optuna."""

    def __init__(
        self,
        objective_fn: Callable[[Trial], float],
        search_space: SearchSpace,
        direction: str = "minimize",
        study_name: str = "hpo_study",
        storage: str | None = None,
    ):
        self.objective_fn = objective_fn
        self.search_space = search_space
        self.direction = direction

        self.study = optuna.create_study(
            study_name=study_name,
            direction=direction,
            sampler=TPESampler(seed=42),
            pruner=MedianPruner(
                n_startup_trials=5,
                n_warmup_steps=10,
            ),
            storage=storage,
            load_if_exists=True,
        )

    def suggest_params(self, trial: Trial) -> dict[str, Any]:
        """Suggest hyperparameters from search space."""
        space = self.search_space

        params = {
            "learning_rate": trial.suggest_float(
                "learning_rate",
                space.learning_rate[0],
                space.learning_rate[1],
                log=True,
            ),
            "batch_size": trial.suggest_categorical(
                "batch_size",
                space.batch_size,
            ),
            "hidden_size": trial.suggest_int(
                "hidden_size",
                space.hidden_size[0],
                space.hidden_size[1],
                step=32,
            ),
            "num_layers": trial.suggest_int(
                "num_layers",
                space.num_layers[0],
                space.num_layers[1],
            ),
            "dropout": trial.suggest_float(
                "dropout",
                space.dropout[0],
                space.dropout[1],
            ),
            "optimizer": trial.suggest_categorical(
                "optimizer",
                space.optimizer,
            ),
        }

        return params

    def optimize(
        self,
        n_trials: int = 100,
        timeout: float | None = None,
        n_jobs: int = 1,
    ) -> dict[str, Any]:
        """Run optimization.

        Args:
            n_trials: Number of trials
            timeout: Maximum time in seconds
            n_jobs: Number of parallel jobs

        Returns:
            Best parameters
        """
        self.study.optimize(
            self.objective_fn,
            n_trials=n_trials,
            timeout=timeout,
            n_jobs=n_jobs,
            show_progress_bar=True,
        )

        return self.study.best_params

    def get_best_trial(self) -> optuna.trial.FrozenTrial:
        """Get best trial."""
        return self.study.best_trial

    def get_importance(self) -> dict[str, float]:
        """Get hyperparameter importance."""
        return optuna.importance.get_param_importances(self.study)


def create_objective(
    model_fn: Callable[[dict], nn.Module],
    train_fn: Callable[[nn.Module, dict], float],
    search_space: SearchSpace,
) -> Callable[[Trial], float]:
    """Create Optuna objective function.

    Args:
        model_fn: Function to create model from params
        train_fn: Function to train model and return metric
        search_space: Search space definition

    Returns:
        Objective function for Optuna
    """
    optimizer = OptunaOptimizer(
        objective_fn=lambda t: 0,  # Placeholder
        search_space=search_space,
    )

    def objective(trial: Trial) -> float:
        # Get suggested parameters
        params = optimizer.suggest_params(trial)

        # Create model
        model = model_fn(params)

        # Train and evaluate
        try:
            metric = train_fn(model, params, trial)
        except RuntimeError as e:
            if "CUDA out of memory" in str(e):
                raise optuna.TrialPruned()
            raise

        return metric

    return objective


# Ray Tune integration
class RayTuneOptimizer:
    """Hyperparameter optimization with Ray Tune."""

    def __init__(
        self,
        trainable: Callable,
        search_space: dict[str, Any],
        metric: str = "val_loss",
        mode: str = "min",
        num_samples: int = 100,
    ):
        from ray import tune
        from ray.tune.schedulers import ASHAScheduler
        from ray.tune.search.optuna import OptunaSearch

        self.tune = tune
        self.trainable = trainable
        self.search_space = search_space
        self.metric = metric
        self.mode = mode
        self.num_samples = num_samples

        # Configure scheduler
        self.scheduler = ASHAScheduler(
            metric=metric,
            mode=mode,
            max_t=100,
            grace_period=10,
            reduction_factor=3,
        )

        # Configure search algorithm
        self.searcher = OptunaSearch(
            metric=metric,
            mode=mode,
        )

    def optimize(self) -> dict[str, Any]:
        """Run hyperparameter optimization."""
        from ray import tune

        analysis = tune.run(
            self.trainable,
            config=self.search_space,
            num_samples=self.num_samples,
            scheduler=self.scheduler,
            search_alg=self.searcher,
            resources_per_trial={"cpu": 2, "gpu": 1},
            progress_reporter=tune.CLIReporter(
                metric_columns=[self.metric],
            ),
        )

        return analysis.best_config


# Example Optuna optimization
def example_optuna():
    """Example hyperparameter optimization."""

    def objective(trial: Trial) -> float:
        # Suggest hyperparameters
        lr = trial.suggest_float("lr", 1e-5, 1e-2, log=True)
        hidden = trial.suggest_int("hidden", 64, 256, step=32)
        dropout = trial.suggest_float("dropout", 0.0, 0.5)

        # Create model
        model = nn.Sequential(
            nn.Linear(784, hidden),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, 10),
        )

        optimizer = torch.optim.Adam(model.parameters(), lr=lr)

        # Training loop (simplified)
        for epoch in range(10):
            loss = train_epoch(model, optimizer)

            # Report intermediate value for pruning
            trial.report(loss, epoch)

            if trial.should_prune():
                raise optuna.TrialPruned()

        return loss

    # Run optimization
    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=100)

    print(f"Best params: {study.best_params}")
    print(f"Best value: {study.best_value}")


def train_epoch(model, optimizer):
    # Placeholder - implement actual training
    return 0.5
```

## Pipeline Orchestration

```python
# training/orchestration.py
"""ML pipeline orchestration with Prefect."""
from pathlib import Path
from typing import Any
from prefect import flow, task
from prefect.artifacts import create_markdown_artifact
import pandas as pd
import torch


@task(name="load_data", retries=2)
def load_data(path: str) -> pd.DataFrame:
    """Load training data."""
    return pd.read_parquet(path)


@task(name="preprocess_data")
def preprocess_data(df: pd.DataFrame) -> tuple:
    """Preprocess data for training."""
    # Feature engineering
    features = df.drop(columns=["target"])
    targets = df["target"]

    # Convert to tensors
    X = torch.tensor(features.values, dtype=torch.float32)
    y = torch.tensor(targets.values, dtype=torch.long)

    return X, y


@task(name="train_model", log_prints=True)
def train_model(
    X: torch.Tensor,
    y: torch.Tensor,
    config: dict[str, Any],
) -> torch.nn.Module:
    """Train ML model."""
    from sklearn.model_selection import train_test_split

    # Split data
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Create model
    model = torch.nn.Sequential(
        torch.nn.Linear(X.shape[1], config["hidden_size"]),
        torch.nn.ReLU(),
        torch.nn.Dropout(config["dropout"]),
        torch.nn.Linear(config["hidden_size"], len(torch.unique(y))),
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=config["learning_rate"])
    criterion = torch.nn.CrossEntropyLoss()

    # Training loop
    for epoch in range(config["epochs"]):
        model.train()
        optimizer.zero_grad()

        outputs = model(X_train)
        loss = criterion(outputs, y_train)
        loss.backward()
        optimizer.step()

        # Validation
        model.eval()
        with torch.no_grad():
            val_outputs = model(X_val)
            val_loss = criterion(val_outputs, y_val)
            val_acc = (val_outputs.argmax(1) == y_val).float().mean()

        print(f"Epoch {epoch+1}: loss={loss:.4f}, val_loss={val_loss:.4f}, val_acc={val_acc:.4f}")

    return model


@task(name="evaluate_model")
def evaluate_model(
    model: torch.nn.Module,
    X: torch.Tensor,
    y: torch.Tensor,
) -> dict[str, float]:
    """Evaluate model performance."""
    model.eval()

    with torch.no_grad():
        outputs = model(X)
        preds = outputs.argmax(1)

        accuracy = (preds == y).float().mean().item()

        # Per-class metrics
        classes = torch.unique(y)
        precision_scores = []
        recall_scores = []

        for c in classes:
            tp = ((preds == c) & (y == c)).sum().item()
            fp = ((preds == c) & (y != c)).sum().item()
            fn = ((preds != c) & (y == c)).sum().item()

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0

            precision_scores.append(precision)
            recall_scores.append(recall)

    metrics = {
        "accuracy": accuracy,
        "precision": sum(precision_scores) / len(precision_scores),
        "recall": sum(recall_scores) / len(recall_scores),
    }

    return metrics


@task(name="save_model")
def save_model(
    model: torch.nn.Module,
    path: str,
    metrics: dict[str, float],
) -> str:
    """Save trained model."""
    save_path = Path(path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    torch.save({
        "model_state_dict": model.state_dict(),
        "metrics": metrics,
    }, save_path)

    return str(save_path)


@task(name="create_report")
def create_report(metrics: dict[str, float], model_path: str) -> None:
    """Create training report artifact."""
    markdown = f"""
# Training Report

## Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | {metrics['accuracy']:.4f} |
| Precision | {metrics['precision']:.4f} |
| Recall | {metrics['recall']:.4f} |

## Model Artifact

Model saved to: `{model_path}`
"""

    create_markdown_artifact(
        key="training-report",
        markdown=markdown,
        description="Training run summary",
    )


@flow(name="training_pipeline")
def training_pipeline(
    data_path: str,
    model_path: str,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Complete ML training pipeline.

    Args:
        data_path: Path to training data
        model_path: Path to save model
        config: Training configuration

    Returns:
        Training metrics
    """
    if config is None:
        config = {
            "hidden_size": 128,
            "dropout": 0.2,
            "learning_rate": 1e-3,
            "epochs": 10,
        }

    # Load and preprocess data
    df = load_data(data_path)
    X, y = preprocess_data(df)

    # Train model
    model = train_model(X, y, config)

    # Evaluate
    metrics = evaluate_model(model, X, y)

    # Save model
    saved_path = save_model(model, model_path, metrics)

    # Create report
    create_report(metrics, saved_path)

    return {"metrics": metrics, "model_path": saved_path}


# Conditional pipeline with branching
@flow(name="conditional_training")
def conditional_training_pipeline(
    data_path: str,
    accuracy_threshold: float = 0.9,
) -> dict[str, Any]:
    """Pipeline with conditional deployment."""

    # Run training
    result = training_pipeline(
        data_path=data_path,
        model_path="./models/model.pt",
    )

    # Conditional deployment
    if result["metrics"]["accuracy"] >= accuracy_threshold:
        deploy_model(result["model_path"])
        return {"deployed": True, **result}
    else:
        return {"deployed": False, **result}


@task
def deploy_model(model_path: str) -> None:
    """Deploy model to production."""
    print(f"Deploying model from {model_path}")
    # Implement deployment logic


# Run with: prefect deployment run 'training_pipeline/training'
if __name__ == "__main__":
    result = training_pipeline(
        data_path="./data/train.parquet",
        model_path="./models/model.pt",
    )
    print(f"Training complete: {result}")
```

## CLAUDE.md Integration

```markdown
# Training Pipeline Integration

## Commands
- `python train.py` - Run training
- `python optimize.py --trials 100` - HPO search
- `torchrun --nproc_per_node=4 train.py` - Distributed training
- `prefect deployment run training` - Run pipeline

## Training Patterns
- Modular callbacks for extensibility
- Mixed precision for faster training
- Gradient accumulation for large batches
- Distributed training with DDP/DeepSpeed

## Development Workflow
1. Define training config
2. Set up callbacks (logging, checkpoints)
3. Run hyperparameter search
4. Train with best params
5. Deploy via pipeline orchestration
```

## AI Suggestions

1. **Auto-scaling training** - Scale workers based on batch queue
2. **Training cost estimation** - Estimate GPU hours before training
3. **Experiment comparison** - Side-by-side comparison of runs
4. **Model ensemble training** - Train multiple models for ensembling
5. **Curriculum learning** - Progressive difficulty training schedules
6. **Multi-objective optimization** - Optimize multiple metrics
7. **Neural architecture search** - Automated model architecture search
8. **Training stability monitoring** - Detect gradient explosions early
9. **Data augmentation pipeline** - Integrated augmentation strategies
10. **Federated learning support** - Privacy-preserving distributed training
