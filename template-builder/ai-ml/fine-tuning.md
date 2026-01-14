# Fine-Tuning Template

> Production-ready fine-tuning configurations for LLM and ML model customization

## Overview

This template provides fine-tuning configurations with:
- OpenAI fine-tuning
- PEFT/LoRA training
- Dataset preparation
- Evaluation metrics
- Model deployment

## Quick Start

```bash
# Install dependencies
pip install openai transformers datasets peft accelerate bitsandbytes
pip install trl evaluate wandb

# Set API keys
export OPENAI_API_KEY=sk-...
export WANDB_API_KEY=...

# Login to Hugging Face
huggingface-cli login
```

## OpenAI Fine-Tuning

```python
# finetuning/openai_finetune.py
from openai import OpenAI
from typing import List, Dict
import json
import time


client = OpenAI()


class OpenAIFineTuner:
    """OpenAI fine-tuning wrapper."""

    def __init__(self):
        self.client = client

    def prepare_dataset(
        self,
        examples: List[Dict],
        output_file: str,
        system_prompt: str = None,
    ) -> str:
        """Prepare dataset in JSONL format."""
        with open(output_file, "w") as f:
            for example in examples:
                messages = []

                if system_prompt:
                    messages.append({
                        "role": "system",
                        "content": system_prompt,
                    })

                messages.append({
                    "role": "user",
                    "content": example["input"],
                })
                messages.append({
                    "role": "assistant",
                    "content": example["output"],
                })

                f.write(json.dumps({"messages": messages}) + "\n")

        return output_file

    def upload_file(self, file_path: str) -> str:
        """Upload training file."""
        with open(file_path, "rb") as f:
            response = self.client.files.create(
                file=f,
                purpose="fine-tune",
            )
        return response.id

    def create_job(
        self,
        training_file_id: str,
        model: str = "gpt-3.5-turbo",
        suffix: str = None,
        n_epochs: int = 3,
        learning_rate_multiplier: float = None,
        batch_size: int = None,
        validation_file_id: str = None,
    ) -> str:
        """Create fine-tuning job."""
        hyperparameters = {"n_epochs": n_epochs}
        if learning_rate_multiplier:
            hyperparameters["learning_rate_multiplier"] = learning_rate_multiplier
        if batch_size:
            hyperparameters["batch_size"] = batch_size

        response = self.client.fine_tuning.jobs.create(
            training_file=training_file_id,
            model=model,
            suffix=suffix,
            hyperparameters=hyperparameters,
            validation_file=validation_file_id,
        )

        return response.id

    def get_job_status(self, job_id: str) -> dict:
        """Get job status."""
        job = self.client.fine_tuning.jobs.retrieve(job_id)
        return {
            "id": job.id,
            "status": job.status,
            "model": job.fine_tuned_model,
            "created_at": job.created_at,
            "finished_at": job.finished_at,
            "trained_tokens": job.trained_tokens,
            "error": job.error,
        }

    def wait_for_completion(
        self,
        job_id: str,
        poll_interval: int = 60,
    ) -> dict:
        """Wait for job to complete."""
        while True:
            status = self.get_job_status(job_id)
            print(f"Status: {status['status']}")

            if status["status"] in ["succeeded", "failed", "cancelled"]:
                return status

            time.sleep(poll_interval)

    def list_jobs(self, limit: int = 10) -> List[dict]:
        """List fine-tuning jobs."""
        response = self.client.fine_tuning.jobs.list(limit=limit)
        return [
            {
                "id": job.id,
                "status": job.status,
                "model": job.fine_tuned_model,
            }
            for job in response.data
        ]

    def cancel_job(self, job_id: str):
        """Cancel a fine-tuning job."""
        self.client.fine_tuning.jobs.cancel(job_id)

    def get_events(self, job_id: str) -> List[dict]:
        """Get job events."""
        response = self.client.fine_tuning.jobs.list_events(
            fine_tuning_job_id=job_id,
            limit=100,
        )
        return [
            {"message": e.message, "created_at": e.created_at}
            for e in response.data
        ]


# Usage
if __name__ == "__main__":
    finetuner = OpenAIFineTuner()

    # Prepare data
    examples = [
        {"input": "Summarize: ...", "output": "Summary: ..."},
        {"input": "Summarize: ...", "output": "Summary: ..."},
    ]

    finetuner.prepare_dataset(examples, "training.jsonl")

    # Upload and train
    file_id = finetuner.upload_file("training.jsonl")
    job_id = finetuner.create_job(
        training_file_id=file_id,
        model="gpt-3.5-turbo",
        suffix="my-model",
    )

    # Wait for completion
    result = finetuner.wait_for_completion(job_id)
    print(f"Fine-tuned model: {result['model']}")
```

## PEFT/LoRA Fine-Tuning

```python
# finetuning/lora_finetune.py
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
)
from datasets import load_dataset, Dataset
from typing import Optional
import os


class LoRAFineTuner:
    """LoRA fine-tuning for efficient model adaptation."""

    def __init__(
        self,
        model_name: str,
        output_dir: str = "./lora_output",
        load_in_8bit: bool = False,
        load_in_4bit: bool = True,
    ):
        self.model_name = model_name
        self.output_dir = output_dir

        # Quantization config
        if load_in_4bit:
            self.bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
            )
        elif load_in_8bit:
            self.bnb_config = BitsAndBytesConfig(load_in_8bit=True)
        else:
            self.bnb_config = None

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=self.bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )

        if self.bnb_config:
            self.model = prepare_model_for_kbit_training(self.model)

    def configure_lora(
        self,
        r: int = 16,
        lora_alpha: int = 32,
        lora_dropout: float = 0.05,
        target_modules: Optional[list] = None,
    ):
        """Configure LoRA adapter."""
        if target_modules is None:
            target_modules = ["q_proj", "v_proj", "k_proj", "o_proj"]

        lora_config = LoraConfig(
            r=r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            target_modules=target_modules,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
        )

        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()

    def prepare_dataset(
        self,
        dataset_name: str = None,
        train_data: list[dict] = None,
        text_column: str = "text",
        max_length: int = 512,
    ):
        """Prepare dataset for training."""
        if dataset_name:
            dataset = load_dataset(dataset_name)
        else:
            dataset = Dataset.from_list(train_data)

        def tokenize_function(examples):
            return self.tokenizer(
                examples[text_column],
                padding="max_length",
                truncation=True,
                max_length=max_length,
            )

        self.train_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset.column_names,
        )

    def train(
        self,
        epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
        gradient_accumulation_steps: int = 4,
        warmup_steps: int = 100,
        logging_steps: int = 10,
        save_steps: int = 100,
        fp16: bool = True,
    ):
        """Train the model."""
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=gradient_accumulation_steps,
            learning_rate=learning_rate,
            warmup_steps=warmup_steps,
            logging_steps=logging_steps,
            save_steps=save_steps,
            fp16=fp16,
            optim="paged_adamw_8bit",
            save_total_limit=3,
            report_to="wandb",
        )

        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            data_collator=data_collator,
        )

        trainer.train()

        # Save adapter
        self.model.save_pretrained(self.output_dir)
        self.tokenizer.save_pretrained(self.output_dir)

        return trainer

    def merge_and_save(self, output_dir: str = None):
        """Merge LoRA weights and save full model."""
        output_dir = output_dir or f"{self.output_dir}/merged"

        merged_model = self.model.merge_and_unload()
        merged_model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        return output_dir


# Usage
if __name__ == "__main__":
    finetuner = LoRAFineTuner(
        model_name="meta-llama/Llama-2-7b-hf",
        load_in_4bit=True,
    )

    finetuner.configure_lora(r=16, lora_alpha=32)

    # Prepare data
    train_data = [
        {"text": "User: Question?\nAssistant: Answer."},
        # ... more examples
    ]
    finetuner.prepare_dataset(train_data=train_data)

    # Train
    finetuner.train(epochs=3)

    # Merge and save
    finetuner.merge_and_save()
```

## SFT with TRL

```python
# finetuning/sft_training.py
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig
from peft import LoraConfig
import torch


class SFTFineTuner:
    """Supervised Fine-Tuning with TRL."""

    def __init__(
        self,
        model_name: str,
        output_dir: str = "./sft_output",
    ):
        self.model_name = model_name
        self.output_dir = output_dir

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

    def train(
        self,
        dataset_name: str = None,
        train_data: list[dict] = None,
        text_column: str = "text",
        max_seq_length: int = 512,
        epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-5,
        use_lora: bool = True,
    ):
        """Train with SFT."""
        # Load dataset
        if dataset_name:
            dataset = load_dataset(dataset_name, split="train")
        else:
            from datasets import Dataset
            dataset = Dataset.from_list(train_data)

        # Model
        model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto",
        )

        # LoRA config
        peft_config = None
        if use_lora:
            peft_config = LoraConfig(
                r=16,
                lora_alpha=32,
                lora_dropout=0.05,
                target_modules=["q_proj", "v_proj"],
                bias="none",
                task_type="CAUSAL_LM",
            )

        # Training config
        training_args = SFTConfig(
            output_dir=self.output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            learning_rate=learning_rate,
            max_seq_length=max_seq_length,
            logging_steps=10,
            save_steps=100,
            bf16=True,
        )

        # Trainer
        trainer = SFTTrainer(
            model=model,
            args=training_args,
            train_dataset=dataset,
            tokenizer=self.tokenizer,
            peft_config=peft_config,
            dataset_text_field=text_column,
        )

        trainer.train()
        trainer.save_model()

        return trainer


# Chat format training
def format_chat_template(example: dict) -> str:
    """Format example for chat training."""
    messages = example.get("messages", [])

    formatted = ""
    for msg in messages:
        role = msg["role"]
        content = msg["content"]

        if role == "system":
            formatted += f"<|system|>\n{content}\n"
        elif role == "user":
            formatted += f"<|user|>\n{content}\n"
        elif role == "assistant":
            formatted += f"<|assistant|>\n{content}\n"

    return formatted


class ChatFineTuner(SFTFineTuner):
    """Fine-tune for chat/instruction following."""

    def prepare_chat_dataset(
        self,
        examples: list[dict],
    ):
        """Prepare dataset in chat format."""
        formatted = [
            {"text": format_chat_template(ex)}
            for ex in examples
        ]
        return formatted
```

## Dataset Preparation

```python
# finetuning/dataset_prep.py
from datasets import Dataset, DatasetDict
from typing import List, Dict, Any
import json
import random


class DatasetPreparator:
    """Prepare datasets for fine-tuning."""

    def __init__(self, tokenizer=None):
        self.tokenizer = tokenizer

    def from_qa_pairs(
        self,
        qa_pairs: List[Dict[str, str]],
        system_prompt: str = None,
    ) -> List[Dict]:
        """Convert Q&A pairs to training format."""
        examples = []

        for pair in qa_pairs:
            messages = []

            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})

            messages.append({"role": "user", "content": pair["question"]})
            messages.append({"role": "assistant", "content": pair["answer"]})

            examples.append({"messages": messages})

        return examples

    def from_completions(
        self,
        completions: List[Dict[str, str]],
    ) -> List[Dict]:
        """Convert prompt-completion pairs."""
        return [
            {"prompt": c["prompt"], "completion": c["completion"]}
            for c in completions
        ]

    def create_instruction_dataset(
        self,
        instructions: List[Dict],
    ) -> List[Dict]:
        """Create instruction-following dataset."""
        examples = []

        for inst in instructions:
            text = f"### Instruction:\n{inst['instruction']}\n\n"

            if inst.get("input"):
                text += f"### Input:\n{inst['input']}\n\n"

            text += f"### Response:\n{inst['output']}"

            examples.append({"text": text})

        return examples

    def split_dataset(
        self,
        examples: List[Dict],
        train_ratio: float = 0.9,
        seed: int = 42,
    ) -> DatasetDict:
        """Split into train/validation sets."""
        random.seed(seed)
        shuffled = examples.copy()
        random.shuffle(shuffled)

        split_idx = int(len(shuffled) * train_ratio)

        return DatasetDict({
            "train": Dataset.from_list(shuffled[:split_idx]),
            "validation": Dataset.from_list(shuffled[split_idx:]),
        })

    def save_jsonl(self, examples: List[Dict], output_path: str):
        """Save dataset as JSONL."""
        with open(output_path, "w") as f:
            for example in examples:
                f.write(json.dumps(example) + "\n")

    def validate_dataset(self, examples: List[Dict]) -> Dict[str, Any]:
        """Validate dataset quality."""
        stats = {
            "total_examples": len(examples),
            "avg_length": 0,
            "min_length": float("inf"),
            "max_length": 0,
            "empty_examples": 0,
        }

        total_length = 0
        for ex in examples:
            text = str(ex)
            length = len(text)
            total_length += length
            stats["min_length"] = min(stats["min_length"], length)
            stats["max_length"] = max(stats["max_length"], length)

            if length < 10:
                stats["empty_examples"] += 1

        stats["avg_length"] = total_length / len(examples) if examples else 0

        return stats
```

## Evaluation

```python
# finetuning/evaluation.py
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import List, Dict
import evaluate


class ModelEvaluator:
    """Evaluate fine-tuned models."""

    def __init__(self, model_path: str):
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map="auto",
        )
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 256,
        temperature: float = 0.7,
    ) -> str:
        """Generate response."""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
            )

        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

    def evaluate_examples(
        self,
        examples: List[Dict],
        reference_key: str = "expected",
        input_key: str = "input",
    ) -> Dict:
        """Evaluate on test examples."""
        bleu = evaluate.load("bleu")
        rouge = evaluate.load("rouge")

        predictions = []
        references = []

        for ex in examples:
            pred = self.generate(ex[input_key])
            predictions.append(pred)
            references.append(ex[reference_key])

        bleu_score = bleu.compute(
            predictions=predictions,
            references=[[r] for r in references],
        )

        rouge_score = rouge.compute(
            predictions=predictions,
            references=references,
        )

        return {
            "bleu": bleu_score["bleu"],
            "rouge1": rouge_score["rouge1"],
            "rouge2": rouge_score["rouge2"],
            "rougeL": rouge_score["rougeL"],
            "num_examples": len(examples),
        }

    def compare_models(
        self,
        base_model_path: str,
        examples: List[Dict],
    ) -> Dict:
        """Compare fine-tuned vs base model."""
        base_evaluator = ModelEvaluator(base_model_path)

        finetuned_scores = self.evaluate_examples(examples)
        base_scores = base_evaluator.evaluate_examples(examples)

        return {
            "finetuned": finetuned_scores,
            "base": base_scores,
            "improvement": {
                k: finetuned_scores[k] - base_scores[k]
                for k in ["bleu", "rouge1", "rouge2", "rougeL"]
            },
        }
```

## CLAUDE.md Integration

```markdown
# Fine-Tuning

## Methods
- **OpenAI** - API-based fine-tuning
- **LoRA/PEFT** - Parameter-efficient tuning
- **Full Fine-tuning** - All parameters

## Best Practices
- Prepare high-quality training data
- Use appropriate learning rates
- Monitor for overfitting
- Evaluate on held-out test set
- Start with smaller models

## Data Formats
- JSONL with messages array (OpenAI)
- Instruction/input/output format
- Chat template format
```

## AI Suggestions

1. **Prepare quality data** - Clean, diverse examples
2. **Use LoRA for efficiency** - Reduce compute costs
3. **Validate dataset** - Check for quality issues
4. **Monitor training** - Use W&B or similar
5. **Evaluate thoroughly** - Multiple metrics
6. **Start small** - Test with smaller models first
7. **Use quantization** - 4-bit/8-bit training
8. **Implement early stopping** - Prevent overfitting
9. **Version datasets** - Track data changes
10. **A/B test models** - Compare to baseline
