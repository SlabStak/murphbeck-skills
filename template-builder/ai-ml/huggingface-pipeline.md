# Hugging Face Pipeline Template

> Production-ready Hugging Face transformers configurations for NLP and ML tasks

## Overview

This template provides Hugging Face configurations with:
- Pipeline API for common tasks
- Custom model loading
- Fine-tuning workflows
- Inference optimization
- Model hub integration

## Quick Start

```bash
# Install dependencies
pip install transformers torch accelerate
pip install datasets evaluate
pip install huggingface_hub

# Login to Hugging Face
huggingface-cli login

# Set cache directory (optional)
export HF_HOME=/path/to/cache
```

## Pipeline API

```python
# pipelines/basic_pipelines.py
from transformers import pipeline
from typing import List, Dict, Any
import torch


class HuggingFacePipelines:
    """Collection of HuggingFace pipelines."""

    def __init__(self, device: int = -1):
        """Initialize with device (-1 for CPU, 0+ for GPU)."""
        self.device = device
        self._pipelines = {}

    def _get_or_create(self, task: str, model: str = None) -> pipeline:
        """Get or create a pipeline."""
        key = f"{task}:{model or 'default'}"
        if key not in self._pipelines:
            kwargs = {"task": task, "device": self.device}
            if model:
                kwargs["model"] = model
            self._pipelines[key] = pipeline(**kwargs)
        return self._pipelines[key]

    # Text Classification
    def classify_text(
        self,
        texts: List[str],
        model: str = "distilbert-base-uncased-finetuned-sst-2-english",
    ) -> List[Dict[str, Any]]:
        """Classify text sentiment or categories."""
        pipe = self._get_or_create("text-classification", model)
        return pipe(texts)

    # Named Entity Recognition
    def extract_entities(
        self,
        texts: List[str],
        model: str = "dslim/bert-base-NER",
    ) -> List[List[Dict[str, Any]]]:
        """Extract named entities from text."""
        pipe = self._get_or_create("ner", model)
        return pipe(texts)

    # Question Answering
    def answer_question(
        self,
        question: str,
        context: str,
        model: str = "distilbert-base-cased-distilled-squad",
    ) -> Dict[str, Any]:
        """Answer question based on context."""
        pipe = self._get_or_create("question-answering", model)
        return pipe(question=question, context=context)

    # Summarization
    def summarize(
        self,
        text: str,
        max_length: int = 150,
        min_length: int = 50,
        model: str = "facebook/bart-large-cnn",
    ) -> str:
        """Summarize text."""
        pipe = self._get_or_create("summarization", model)
        result = pipe(text, max_length=max_length, min_length=min_length)
        return result[0]["summary_text"]

    # Translation
    def translate(
        self,
        text: str,
        model: str = "Helsinki-NLP/opus-mt-en-de",
    ) -> str:
        """Translate text."""
        pipe = self._get_or_create("translation", model)
        result = pipe(text)
        return result[0]["translation_text"]

    # Text Generation
    def generate_text(
        self,
        prompt: str,
        max_new_tokens: int = 100,
        model: str = "gpt2",
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        """Generate text from prompt."""
        pipe = self._get_or_create("text-generation", model)
        result = pipe(
            prompt,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
        )
        return result[0]["generated_text"]

    # Fill Mask
    def fill_mask(
        self,
        text: str,
        model: str = "bert-base-uncased",
    ) -> List[Dict[str, Any]]:
        """Fill masked tokens in text."""
        pipe = self._get_or_create("fill-mask", model)
        return pipe(text)

    # Zero-Shot Classification
    def zero_shot_classify(
        self,
        text: str,
        labels: List[str],
        model: str = "facebook/bart-large-mnli",
    ) -> Dict[str, Any]:
        """Classify text with custom labels."""
        pipe = self._get_or_create("zero-shot-classification", model)
        return pipe(text, labels)

    # Sentence Similarity
    def sentence_similarity(
        self,
        sentences: List[str],
        model: str = "sentence-transformers/all-MiniLM-L6-v2",
    ) -> List[List[float]]:
        """Calculate sentence embeddings."""
        pipe = self._get_or_create("feature-extraction", model)
        embeddings = pipe(sentences)
        return embeddings


# Usage
if __name__ == "__main__":
    hf = HuggingFacePipelines(device=0 if torch.cuda.is_available() else -1)

    # Sentiment analysis
    result = hf.classify_text(["I love this product!", "This is terrible."])
    print(result)

    # NER
    entities = hf.extract_entities(["John works at Google in New York."])
    print(entities)

    # Q&A
    answer = hf.answer_question(
        question="What is the capital of France?",
        context="Paris is the capital and most populous city of France.",
    )
    print(answer)
```

## Custom Model Loading

```python
# models/custom_loading.py
from transformers import (
    AutoModel,
    AutoModelForSequenceClassification,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    AutoConfig,
    BitsAndBytesConfig,
)
import torch
from typing import Optional, Tuple


class ModelLoader:
    """Load and configure HuggingFace models."""

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = cache_dir
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def load_classification_model(
        self,
        model_name: str,
        num_labels: int = 2,
    ) -> Tuple[AutoModelForSequenceClassification, AutoTokenizer]:
        """Load a classification model."""
        config = AutoConfig.from_pretrained(
            model_name,
            num_labels=num_labels,
            cache_dir=self.cache_dir,
        )

        model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            config=config,
            cache_dir=self.cache_dir,
        )
        model.to(self.device)

        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )

        return model, tokenizer

    def load_causal_lm(
        self,
        model_name: str,
        load_in_8bit: bool = False,
        load_in_4bit: bool = False,
        torch_dtype: torch.dtype = torch.float16,
    ) -> Tuple[AutoModelForCausalLM, AutoTokenizer]:
        """Load a causal language model."""
        kwargs = {
            "cache_dir": self.cache_dir,
            "torch_dtype": torch_dtype,
            "device_map": "auto",
        }

        if load_in_8bit or load_in_4bit:
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=load_in_8bit,
                load_in_4bit=load_in_4bit,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )
            kwargs["quantization_config"] = quantization_config

        model = AutoModelForCausalLM.from_pretrained(model_name, **kwargs)

        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )

        # Set padding token
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        return model, tokenizer

    def load_seq2seq_model(
        self,
        model_name: str,
    ) -> Tuple[AutoModelForSeq2SeqLM, AutoTokenizer]:
        """Load a sequence-to-sequence model."""
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )
        model.to(self.device)

        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )

        return model, tokenizer

    def load_embedding_model(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    ) -> Tuple[AutoModel, AutoTokenizer]:
        """Load a model for embeddings."""
        model = AutoModel.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )
        model.to(self.device)

        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=self.cache_dir,
        )

        return model, tokenizer


# Inference helpers
class Inference:
    """Inference utilities."""

    @staticmethod
    def classify(
        model: AutoModelForSequenceClassification,
        tokenizer: AutoTokenizer,
        texts: list[str],
        device: torch.device,
    ) -> list[dict]:
        """Run classification inference."""
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)

        results = []
        for i, text in enumerate(texts):
            pred = torch.argmax(probs[i]).item()
            results.append({
                "text": text,
                "label": pred,
                "confidence": probs[i][pred].item(),
            })

        return results

    @staticmethod
    def generate(
        model: AutoModelForCausalLM,
        tokenizer: AutoTokenizer,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        """Generate text."""
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
            )

        return tokenizer.decode(outputs[0], skip_special_tokens=True)

    @staticmethod
    def embed(
        model: AutoModel,
        tokenizer: AutoTokenizer,
        texts: list[str],
        device: torch.device,
    ) -> torch.Tensor:
        """Generate embeddings using mean pooling."""
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            # Mean pooling
            attention_mask = inputs["attention_mask"]
            token_embeddings = outputs.last_hidden_state
            input_mask_expanded = (
                attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            )
            embeddings = torch.sum(
                token_embeddings * input_mask_expanded, 1
            ) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

        return embeddings
```

## Fine-tuning Workflow

```python
# training/fine_tuning.py
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
)
from datasets import load_dataset, Dataset
import evaluate
import numpy as np
from typing import Dict, Any


class FineTuner:
    """Fine-tune HuggingFace models."""

    def __init__(
        self,
        model_name: str,
        num_labels: int,
        output_dir: str = "./model_output",
    ):
        self.model_name = model_name
        self.num_labels = num_labels
        self.output_dir = output_dir

        # Load model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels,
        )

        # Metrics
        self.accuracy = evaluate.load("accuracy")
        self.f1 = evaluate.load("f1")

    def prepare_dataset(
        self,
        dataset_name: str = None,
        train_texts: list = None,
        train_labels: list = None,
        val_texts: list = None,
        val_labels: list = None,
    ):
        """Prepare dataset for training."""
        if dataset_name:
            dataset = load_dataset(dataset_name)
            self.train_dataset = dataset["train"]
            self.val_dataset = dataset["validation"]
        else:
            self.train_dataset = Dataset.from_dict({
                "text": train_texts,
                "label": train_labels,
            })
            self.val_dataset = Dataset.from_dict({
                "text": val_texts,
                "label": val_labels,
            })

        # Tokenize
        def tokenize_function(examples):
            return self.tokenizer(
                examples["text"],
                padding=False,
                truncation=True,
                max_length=512,
            )

        self.train_dataset = self.train_dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=["text"],
        )
        self.val_dataset = self.val_dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=["text"],
        )

    def compute_metrics(self, eval_pred) -> Dict[str, float]:
        """Compute evaluation metrics."""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)

        accuracy = self.accuracy.compute(
            predictions=predictions,
            references=labels,
        )
        f1 = self.f1.compute(
            predictions=predictions,
            references=labels,
            average="weighted",
        )

        return {
            "accuracy": accuracy["accuracy"],
            "f1": f1["f1"],
        }

    def train(
        self,
        epochs: int = 3,
        batch_size: int = 16,
        learning_rate: float = 2e-5,
        weight_decay: float = 0.01,
        warmup_ratio: float = 0.1,
        early_stopping_patience: int = 3,
    ):
        """Train the model."""
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            learning_rate=learning_rate,
            weight_decay=weight_decay,
            warmup_ratio=warmup_ratio,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            greater_is_better=True,
            logging_steps=100,
            fp16=True,
            push_to_hub=False,
        )

        data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            eval_dataset=self.val_dataset,
            tokenizer=self.tokenizer,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
            callbacks=[
                EarlyStoppingCallback(early_stopping_patience=early_stopping_patience)
            ],
        )

        trainer.train()

        # Save best model
        trainer.save_model(self.output_dir)
        self.tokenizer.save_pretrained(self.output_dir)

        return trainer

    def push_to_hub(self, repo_name: str):
        """Push model to Hugging Face Hub."""
        self.model.push_to_hub(repo_name)
        self.tokenizer.push_to_hub(repo_name)


# Usage
if __name__ == "__main__":
    finetuner = FineTuner(
        model_name="distilbert-base-uncased",
        num_labels=2,
        output_dir="./sentiment_model",
    )

    finetuner.prepare_dataset(dataset_name="imdb")

    trainer = finetuner.train(
        epochs=3,
        batch_size=16,
        learning_rate=2e-5,
    )
```

## Optimized Inference

```python
# inference/optimized.py
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from torch.cuda.amp import autocast
from typing import List, Dict
import onnxruntime as ort
import numpy as np


class OptimizedInference:
    """Optimized inference utilities."""

    @staticmethod
    def export_to_onnx(
        model,
        tokenizer,
        output_path: str,
        opset_version: int = 14,
    ):
        """Export model to ONNX format."""
        model.eval()

        dummy_input = tokenizer(
            "Example text for export",
            return_tensors="pt",
            padding="max_length",
            max_length=128,
        )

        torch.onnx.export(
            model,
            (dummy_input["input_ids"], dummy_input["attention_mask"]),
            output_path,
            input_names=["input_ids", "attention_mask"],
            output_names=["logits"],
            dynamic_axes={
                "input_ids": {0: "batch_size", 1: "sequence"},
                "attention_mask": {0: "batch_size", 1: "sequence"},
                "logits": {0: "batch_size"},
            },
            opset_version=opset_version,
        )

    @staticmethod
    def load_onnx_model(model_path: str) -> ort.InferenceSession:
        """Load ONNX model for inference."""
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
        return ort.InferenceSession(model_path, providers=providers)

    @staticmethod
    def onnx_inference(
        session: ort.InferenceSession,
        tokenizer: AutoTokenizer,
        texts: List[str],
    ) -> List[Dict]:
        """Run ONNX inference."""
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="np",
        )

        outputs = session.run(
            None,
            {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64),
            },
        )

        logits = outputs[0]
        probs = np.exp(logits) / np.sum(np.exp(logits), axis=-1, keepdims=True)
        predictions = np.argmax(probs, axis=-1)

        results = []
        for i in range(len(texts)):
            results.append({
                "prediction": int(predictions[i]),
                "confidence": float(probs[i][predictions[i]]),
            })

        return results


class TorchCompileInference:
    """Inference with torch.compile optimization."""

    def __init__(self, model_name: str):
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

        # Compile model for faster inference
        if torch.cuda.is_available():
            self.model = torch.compile(self.model, mode="reduce-overhead")

    @torch.no_grad()
    def predict(self, texts: List[str]) -> List[Dict]:
        """Run optimized inference."""
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with autocast():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)

        predictions = torch.argmax(probs, dim=-1)

        results = []
        for i in range(len(texts)):
            results.append({
                "prediction": predictions[i].item(),
                "confidence": probs[i][predictions[i]].item(),
            })

        return results
```

## Model Hub Integration

```python
# hub/integration.py
from huggingface_hub import HfApi, Repository, create_repo, login
from transformers import AutoModel, AutoTokenizer
import os


class HubManager:
    """Manage Hugging Face Hub operations."""

    def __init__(self, token: str = None):
        self.token = token or os.environ.get("HF_TOKEN")
        self.api = HfApi(token=self.token)

    def create_model_repo(
        self,
        repo_name: str,
        private: bool = False,
    ) -> str:
        """Create a new model repository."""
        repo_url = create_repo(
            repo_id=repo_name,
            token=self.token,
            private=private,
            repo_type="model",
        )
        return repo_url

    def push_model(
        self,
        model,
        tokenizer,
        repo_name: str,
        commit_message: str = "Upload model",
    ):
        """Push model to Hub."""
        model.push_to_hub(
            repo_name,
            token=self.token,
            commit_message=commit_message,
        )
        tokenizer.push_to_hub(
            repo_name,
            token=self.token,
            commit_message=commit_message,
        )

    def download_model(
        self,
        repo_name: str,
        local_dir: str,
    ):
        """Download model from Hub."""
        self.api.snapshot_download(
            repo_id=repo_name,
            local_dir=local_dir,
            token=self.token,
        )

    def list_models(
        self,
        author: str = None,
        search: str = None,
        limit: int = 10,
    ) -> list:
        """List models on Hub."""
        return list(
            self.api.list_models(
                author=author,
                search=search,
                limit=limit,
            )
        )

    def get_model_info(self, repo_name: str) -> dict:
        """Get model information."""
        return self.api.model_info(repo_name)
```

## CLAUDE.md Integration

```markdown
# Hugging Face Pipeline

## Installation
```bash
pip install transformers torch datasets
```

## Common Tasks
- `text-classification` - Sentiment, topic
- `ner` - Named entity recognition
- `question-answering` - Q&A
- `summarization` - Text summarization
- `translation` - Language translation
- `text-generation` - Text generation

## Model Loading
- `AutoModel` - Base models
- `AutoModelForSequenceClassification` - Classification
- `AutoModelForCausalLM` - Text generation
- `AutoTokenizer` - Tokenization

## Best Practices
- Use pipelines for quick inference
- Fine-tune on domain data
- Optimize for production (ONNX, quantization)
- Cache models for reuse
```

## AI Suggestions

1. **Use pipelines** - Quick inference setup
2. **Implement caching** - Cache models and tokenizers
3. **Add quantization** - 8-bit or 4-bit loading
4. **Export to ONNX** - Optimized inference
5. **Use torch.compile** - PyTorch 2.0 optimization
6. **Implement batching** - Batch inference
7. **Add monitoring** - Track inference metrics
8. **Configure mixed precision** - FP16 inference
9. **Use Hub integration** - Model versioning
10. **Add evaluation** - Track model performance
