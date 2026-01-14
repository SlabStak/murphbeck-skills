# Evaluation Harness Template

> Production-ready evaluation configurations for LLM and ML model assessment

## Overview

This template provides evaluation configurations with:
- LLM benchmarking
- Custom evaluation metrics
- A/B testing framework
- Automated evaluation pipelines
- Human evaluation tools

## Quick Start

```bash
# Install dependencies
pip install evaluate lm-eval openai anthropic
pip install rouge-score bert-score
pip install pandas numpy scipy

# Set API keys
export OPENAI_API_KEY=sk-...
```

## LLM Evaluation Framework

```python
# evaluation/llm_eval.py
from typing import List, Dict, Any, Callable, Optional
from dataclasses import dataclass
from abc import ABC, abstractmethod
import asyncio
import json
import time


@dataclass
class EvalExample:
    """Single evaluation example."""
    input: str
    expected: str
    metadata: Dict[str, Any] = None


@dataclass
class EvalResult:
    """Single evaluation result."""
    example: EvalExample
    output: str
    scores: Dict[str, float]
    latency_ms: float
    error: Optional[str] = None


class Evaluator(ABC):
    """Base evaluator class."""

    @abstractmethod
    def score(self, output: str, expected: str, input: str = None) -> Dict[str, float]:
        """Score a single output."""
        pass


class ExactMatchEvaluator(Evaluator):
    """Exact match evaluation."""

    def score(self, output: str, expected: str, input: str = None) -> Dict[str, float]:
        normalized_output = output.strip().lower()
        normalized_expected = expected.strip().lower()
        return {"exact_match": 1.0 if normalized_output == normalized_expected else 0.0}


class ContainsEvaluator(Evaluator):
    """Check if output contains expected."""

    def score(self, output: str, expected: str, input: str = None) -> Dict[str, float]:
        return {"contains": 1.0 if expected.lower() in output.lower() else 0.0}


class LLMJudgeEvaluator(Evaluator):
    """Use LLM as judge for evaluation."""

    def __init__(
        self,
        model: str = "gpt-4-turbo-preview",
        criteria: str = "correctness",
    ):
        from openai import OpenAI
        self.client = OpenAI()
        self.model = model
        self.criteria = criteria

    def score(self, output: str, expected: str, input: str = None) -> Dict[str, float]:
        prompt = f"""Evaluate the following response on a scale of 0-10 for {self.criteria}.

Question: {input}
Expected Answer: {expected}
Actual Response: {output}

Score (0-10):"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0,
        )

        try:
            score_text = response.choices[0].message.content.strip()
            score = float(score_text.split()[0]) / 10.0
        except:
            score = 0.0

        return {f"llm_judge_{self.criteria}": score}


class CompositeEvaluator(Evaluator):
    """Combine multiple evaluators."""

    def __init__(self, evaluators: List[Evaluator]):
        self.evaluators = evaluators

    def score(self, output: str, expected: str, input: str = None) -> Dict[str, float]:
        all_scores = {}
        for evaluator in self.evaluators:
            scores = evaluator.score(output, expected, input)
            all_scores.update(scores)
        return all_scores


class EvalHarness:
    """Main evaluation harness."""

    def __init__(
        self,
        model_fn: Callable[[str], str],
        evaluators: List[Evaluator],
    ):
        self.model_fn = model_fn
        self.evaluators = evaluators
        self.composite = CompositeEvaluator(evaluators)

    def evaluate_single(self, example: EvalExample) -> EvalResult:
        """Evaluate a single example."""
        start_time = time.time()
        error = None

        try:
            output = self.model_fn(example.input)
        except Exception as e:
            output = ""
            error = str(e)

        latency_ms = (time.time() - start_time) * 1000

        scores = self.composite.score(output, example.expected, example.input)

        return EvalResult(
            example=example,
            output=output,
            scores=scores,
            latency_ms=latency_ms,
            error=error,
        )

    def evaluate_batch(
        self,
        examples: List[EvalExample],
        show_progress: bool = True,
    ) -> List[EvalResult]:
        """Evaluate a batch of examples."""
        results = []

        for i, example in enumerate(examples):
            if show_progress:
                print(f"Evaluating {i + 1}/{len(examples)}...")

            result = self.evaluate_single(example)
            results.append(result)

        return results

    def summarize(self, results: List[EvalResult]) -> Dict[str, Any]:
        """Summarize evaluation results."""
        all_scores = {}
        latencies = []
        errors = 0

        for result in results:
            latencies.append(result.latency_ms)
            if result.error:
                errors += 1
            for metric, score in result.scores.items():
                if metric not in all_scores:
                    all_scores[metric] = []
                all_scores[metric].append(score)

        summary = {
            "num_examples": len(results),
            "num_errors": errors,
            "avg_latency_ms": sum(latencies) / len(latencies) if latencies else 0,
            "p50_latency_ms": sorted(latencies)[len(latencies) // 2] if latencies else 0,
            "p95_latency_ms": sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0,
            "metrics": {},
        }

        for metric, scores in all_scores.items():
            summary["metrics"][metric] = {
                "mean": sum(scores) / len(scores),
                "min": min(scores),
                "max": max(scores),
            }

        return summary


# Usage
if __name__ == "__main__":
    from openai import OpenAI

    client = OpenAI()

    def model_fn(prompt: str) -> str:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content

    harness = EvalHarness(
        model_fn=model_fn,
        evaluators=[
            ExactMatchEvaluator(),
            ContainsEvaluator(),
        ],
    )

    examples = [
        EvalExample(input="What is 2+2?", expected="4"),
        EvalExample(input="Capital of France?", expected="Paris"),
    ]

    results = harness.evaluate_batch(examples)
    summary = harness.summarize(results)
    print(json.dumps(summary, indent=2))
```

## NLP Metrics

```python
# evaluation/nlp_metrics.py
import evaluate
from typing import List, Dict
import numpy as np


class NLPMetrics:
    """Standard NLP evaluation metrics."""

    def __init__(self):
        self.bleu = evaluate.load("bleu")
        self.rouge = evaluate.load("rouge")
        self.bertscore = evaluate.load("bertscore")

    def compute_bleu(
        self,
        predictions: List[str],
        references: List[List[str]],
    ) -> Dict[str, float]:
        """Compute BLEU score."""
        result = self.bleu.compute(
            predictions=predictions,
            references=references,
        )
        return {
            "bleu": result["bleu"],
            "bleu_1": result["precisions"][0],
            "bleu_2": result["precisions"][1],
            "bleu_3": result["precisions"][2],
            "bleu_4": result["precisions"][3],
        }

    def compute_rouge(
        self,
        predictions: List[str],
        references: List[str],
    ) -> Dict[str, float]:
        """Compute ROUGE scores."""
        result = self.rouge.compute(
            predictions=predictions,
            references=references,
        )
        return {
            "rouge1": result["rouge1"],
            "rouge2": result["rouge2"],
            "rougeL": result["rougeL"],
            "rougeLsum": result["rougeLsum"],
        }

    def compute_bertscore(
        self,
        predictions: List[str],
        references: List[str],
        model_type: str = "microsoft/deberta-xlarge-mnli",
    ) -> Dict[str, float]:
        """Compute BERTScore."""
        result = self.bertscore.compute(
            predictions=predictions,
            references=references,
            model_type=model_type,
        )
        return {
            "bertscore_precision": np.mean(result["precision"]),
            "bertscore_recall": np.mean(result["recall"]),
            "bertscore_f1": np.mean(result["f1"]),
        }

    def compute_all(
        self,
        predictions: List[str],
        references: List[str],
    ) -> Dict[str, float]:
        """Compute all metrics."""
        all_metrics = {}

        # BLEU (needs references as list of lists)
        refs_for_bleu = [[r] for r in references]
        all_metrics.update(self.compute_bleu(predictions, refs_for_bleu))

        # ROUGE
        all_metrics.update(self.compute_rouge(predictions, references))

        # BERTScore
        all_metrics.update(self.compute_bertscore(predictions, references))

        return all_metrics


# Semantic similarity
class SemanticSimilarity:
    """Compute semantic similarity using embeddings."""

    def __init__(self, model: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model)

    def compute(
        self,
        predictions: List[str],
        references: List[str],
    ) -> Dict[str, float]:
        """Compute cosine similarity."""
        pred_embeddings = self.model.encode(predictions)
        ref_embeddings = self.model.encode(references)

        similarities = []
        for pred_emb, ref_emb in zip(pred_embeddings, ref_embeddings):
            sim = np.dot(pred_emb, ref_emb) / (
                np.linalg.norm(pred_emb) * np.linalg.norm(ref_emb)
            )
            similarities.append(sim)

        return {
            "semantic_similarity_mean": np.mean(similarities),
            "semantic_similarity_min": np.min(similarities),
            "semantic_similarity_max": np.max(similarities),
        }
```

## A/B Testing Framework

```python
# evaluation/ab_testing.py
from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass
import random
import json
from datetime import datetime
import numpy as np
from scipy import stats


@dataclass
class ABTestResult:
    """Result of an A/B test."""
    model_a_scores: List[float]
    model_b_scores: List[float]
    model_a_mean: float
    model_b_mean: float
    p_value: float
    significant: bool
    winner: Optional[str]


class ABTester:
    """A/B testing for model comparison."""

    def __init__(
        self,
        model_a: Callable[[str], str],
        model_b: Callable[[str], str],
        evaluator: Callable[[str, str], float],
        significance_level: float = 0.05,
    ):
        self.model_a = model_a
        self.model_b = model_b
        self.evaluator = evaluator
        self.significance_level = significance_level

    def run_test(
        self,
        examples: List[Dict[str, str]],
        metric_name: str = "score",
    ) -> ABTestResult:
        """Run A/B test on examples."""
        model_a_scores = []
        model_b_scores = []

        for example in examples:
            input_text = example["input"]
            expected = example["expected"]

            # Get outputs
            output_a = self.model_a(input_text)
            output_b = self.model_b(input_text)

            # Score outputs
            score_a = self.evaluator(output_a, expected)
            score_b = self.evaluator(output_b, expected)

            model_a_scores.append(score_a)
            model_b_scores.append(score_b)

        # Statistical test
        t_stat, p_value = stats.ttest_rel(model_a_scores, model_b_scores)

        model_a_mean = np.mean(model_a_scores)
        model_b_mean = np.mean(model_b_scores)

        significant = p_value < self.significance_level

        winner = None
        if significant:
            winner = "model_a" if model_a_mean > model_b_mean else "model_b"

        return ABTestResult(
            model_a_scores=model_a_scores,
            model_b_scores=model_b_scores,
            model_a_mean=model_a_mean,
            model_b_mean=model_b_mean,
            p_value=p_value,
            significant=significant,
            winner=winner,
        )

    def bootstrap_comparison(
        self,
        examples: List[Dict[str, str]],
        n_bootstrap: int = 1000,
    ) -> Dict[str, Any]:
        """Bootstrap comparison of models."""
        all_diffs = []

        for example in examples:
            output_a = self.model_a(example["input"])
            output_b = self.model_b(example["input"])

            score_a = self.evaluator(output_a, example["expected"])
            score_b = self.evaluator(output_b, example["expected"])

            all_diffs.append(score_a - score_b)

        # Bootstrap
        bootstrap_means = []
        for _ in range(n_bootstrap):
            sample = np.random.choice(all_diffs, size=len(all_diffs), replace=True)
            bootstrap_means.append(np.mean(sample))

        ci_lower = np.percentile(bootstrap_means, 2.5)
        ci_upper = np.percentile(bootstrap_means, 97.5)

        return {
            "mean_diff": np.mean(all_diffs),
            "ci_95_lower": ci_lower,
            "ci_95_upper": ci_upper,
            "significant": ci_lower > 0 or ci_upper < 0,
            "model_a_better": np.mean(all_diffs) > 0,
        }
```

## Human Evaluation

```python
# evaluation/human_eval.py
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json
import random
from datetime import datetime


@dataclass
class HumanAnnotation:
    """Single human annotation."""
    example_id: str
    annotator_id: str
    output: str
    ratings: Dict[str, int]
    preference: Optional[str]
    comments: str
    timestamp: str


class HumanEvalPlatform:
    """Platform for human evaluation."""

    def __init__(self, storage_path: str = "./human_eval"):
        self.storage_path = storage_path
        self.annotations: List[HumanAnnotation] = []

    def create_evaluation_batch(
        self,
        examples: List[Dict],
        model_outputs: Dict[str, List[str]],
        randomize: bool = True,
    ) -> List[Dict]:
        """Create batch for human evaluation."""
        batch = []

        for i, example in enumerate(examples):
            outputs = {
                model: outputs[i]
                for model, outputs in model_outputs.items()
            }

            # Anonymize model names if randomizing
            if randomize:
                models = list(outputs.keys())
                random.shuffle(models)
                outputs = {
                    f"Option {chr(65 + j)}": outputs[m]
                    for j, m in enumerate(models)
                }
                mapping = {
                    f"Option {chr(65 + j)}": m
                    for j, m in enumerate(models)
                }
            else:
                mapping = None

            batch.append({
                "id": f"example_{i}",
                "input": example["input"],
                "reference": example.get("expected"),
                "outputs": outputs,
                "model_mapping": mapping,
            })

        return batch

    def record_annotation(
        self,
        example_id: str,
        annotator_id: str,
        output: str,
        ratings: Dict[str, int],
        preference: str = None,
        comments: str = "",
    ):
        """Record a human annotation."""
        annotation = HumanAnnotation(
            example_id=example_id,
            annotator_id=annotator_id,
            output=output,
            ratings=ratings,
            preference=preference,
            comments=comments,
            timestamp=datetime.utcnow().isoformat(),
        )
        self.annotations.append(annotation)
        self._save_annotation(annotation)

    def _save_annotation(self, annotation: HumanAnnotation):
        """Save annotation to storage."""
        import os
        os.makedirs(self.storage_path, exist_ok=True)

        path = f"{self.storage_path}/{annotation.example_id}_{annotation.annotator_id}.json"
        with open(path, "w") as f:
            json.dump(annotation.__dict__, f)

    def compute_agreement(self) -> Dict[str, float]:
        """Compute inter-annotator agreement."""
        from collections import defaultdict

        # Group by example
        by_example = defaultdict(list)
        for ann in self.annotations:
            by_example[ann.example_id].append(ann)

        agreements = []
        for example_id, anns in by_example.items():
            if len(anns) < 2:
                continue

            # Pairwise agreement
            for i in range(len(anns)):
                for j in range(i + 1, len(anns)):
                    if anns[i].preference == anns[j].preference:
                        agreements.append(1.0)
                    else:
                        agreements.append(0.0)

        return {
            "agreement_rate": sum(agreements) / len(agreements) if agreements else 0,
            "num_comparisons": len(agreements),
        }

    def summarize_ratings(self) -> Dict[str, Any]:
        """Summarize human ratings."""
        from collections import defaultdict
        import numpy as np

        ratings_by_criteria = defaultdict(list)
        preferences = defaultdict(int)

        for ann in self.annotations:
            for criteria, rating in ann.ratings.items():
                ratings_by_criteria[criteria].append(rating)

            if ann.preference:
                preferences[ann.preference] += 1

        summary = {
            "num_annotations": len(self.annotations),
            "ratings": {
                criteria: {
                    "mean": np.mean(scores),
                    "std": np.std(scores),
                }
                for criteria, scores in ratings_by_criteria.items()
            },
            "preferences": dict(preferences),
        }

        return summary
```

## Benchmark Suites

```python
# evaluation/benchmarks.py
from typing import List, Dict, Callable
from datasets import load_dataset
import json


class BenchmarkSuite:
    """Standard benchmark evaluation."""

    def __init__(self, model_fn: Callable[[str], str]):
        self.model_fn = model_fn

    def evaluate_mmlu(self, subjects: List[str] = None) -> Dict:
        """Evaluate on MMLU benchmark."""
        dataset = load_dataset("cais/mmlu", "all", split="test")

        if subjects:
            dataset = dataset.filter(lambda x: x["subject"] in subjects)

        correct = 0
        total = 0

        for example in dataset:
            question = example["question"]
            choices = example["choices"]
            answer_idx = example["answer"]

            prompt = f"Question: {question}\n"
            for i, choice in enumerate(choices):
                prompt += f"{chr(65 + i)}. {choice}\n"
            prompt += "Answer:"

            response = self.model_fn(prompt)

            # Parse response
            predicted = response.strip().upper()[0] if response else ""
            expected = chr(65 + answer_idx)

            if predicted == expected:
                correct += 1
            total += 1

        return {
            "accuracy": correct / total if total > 0 else 0,
            "correct": correct,
            "total": total,
        }

    def evaluate_hellaswag(self, limit: int = 1000) -> Dict:
        """Evaluate on HellaSwag benchmark."""
        dataset = load_dataset("hellaswag", split="validation")

        if limit:
            dataset = dataset.select(range(min(limit, len(dataset))))

        correct = 0
        total = 0

        for example in dataset:
            context = example["ctx"]
            endings = example["endings"]
            answer = example["label"]

            prompt = f"Context: {context}\n\nWhich ending is most likely?\n"
            for i, ending in enumerate(endings):
                prompt += f"{chr(65 + i)}. {ending}\n"
            prompt += "Answer:"

            response = self.model_fn(prompt)

            predicted = response.strip().upper()[0] if response else ""
            expected = chr(65 + int(answer))

            if predicted == expected:
                correct += 1
            total += 1

        return {
            "accuracy": correct / total if total > 0 else 0,
            "correct": correct,
            "total": total,
        }

    def evaluate_truthfulqa(self, limit: int = 500) -> Dict:
        """Evaluate on TruthfulQA benchmark."""
        dataset = load_dataset("truthful_qa", "generation", split="validation")

        if limit:
            dataset = dataset.select(range(min(limit, len(dataset))))

        results = []

        for example in dataset:
            question = example["question"]
            best_answer = example["best_answer"]
            correct_answers = example["correct_answers"]

            response = self.model_fn(question)

            # Check if response is truthful
            is_truthful = any(
                ans.lower() in response.lower()
                for ans in correct_answers
            )

            results.append({
                "question": question,
                "response": response,
                "is_truthful": is_truthful,
            })

        truthful_count = sum(1 for r in results if r["is_truthful"])

        return {
            "truthful_rate": truthful_count / len(results) if results else 0,
            "truthful_count": truthful_count,
            "total": len(results),
        }
```

## CLAUDE.md Integration

```markdown
# Evaluation Harness

## Metrics
- **Exact Match** - Exact string comparison
- **BLEU/ROUGE** - Text generation metrics
- **BERTScore** - Semantic similarity
- **LLM-as-Judge** - AI-powered evaluation

## Evaluation Types
- Automated metrics
- A/B testing
- Human evaluation
- Benchmark suites

## Best Practices
- Use multiple metrics
- Include human evaluation
- Test on diverse examples
- Report confidence intervals
```

## AI Suggestions

1. **Use multiple metrics** - Comprehensive evaluation
2. **Include human eval** - Ground truth validation
3. **A/B test changes** - Statistical significance
4. **Benchmark regularly** - Track regressions
5. **Stratify by category** - Identify weaknesses
6. **Compute confidence intervals** - Uncertainty estimation
7. **Version test sets** - Reproducibility
8. **Monitor in production** - Real-world performance
9. **Use LLM-as-judge** - Scalable evaluation
10. **Document limitations** - Known failure modes
