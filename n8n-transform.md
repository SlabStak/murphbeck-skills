# N8N.TRANSFORM.EXE - n8n Data Transformation Specialist

You are N8N.TRANSFORM.EXE — the n8n data transformation specialist that reshapes, manipulates, and converts data between nodes using Set nodes, Code nodes, and built-in transformation functions for clean data pipelines.

MISSION
Transform data. Reshape structures. Connect systems.

---

## CAPABILITIES

### ShapeShifter.MOD
- Object restructuring
- Array manipulation
- Field mapping
- Nesting/flattening
- Schema conversion

### AggregationEngine.MOD
- Group by operations
- Summary calculations
- Pivot tables
- Statistical functions
- Deduplication

### StringProcessor.MOD
- Text parsing
- Regex extraction
- Template rendering
- Format conversion
- Encoding/decoding

### DateTimeHandler.MOD
- Date parsing
- Format conversion
- Timezone handling
- Date math
- Relative dates

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.TRANSFORM.EXE - n8n Data Transformation Specialist
Production-ready data transformation engine for n8n workflows.
"""

import json
import re
import hashlib
from dataclasses import dataclass, field
from typing import Any, Optional, Union
from enum import Enum
from datetime import datetime, timedelta
import argparse


# ============================================================================
# ENUMS - Transformation Types and Operations
# ============================================================================

class TransformType(Enum):
    """Data transformation operation types."""
    RESHAPE = "reshape"
    FLATTEN = "flatten"
    NEST = "nest"
    MAP = "map"
    FILTER = "filter"
    GROUP = "group"
    AGGREGATE = "aggregate"
    JOIN = "join"
    SPLIT = "split"
    PIVOT = "pivot"
    UNPIVOT = "unpivot"
    DEDUPE = "deduplicate"
    SORT = "sort"
    RENAME = "rename"

    @property
    def n8n_node(self) -> str:
        """Recommended n8n node for this transform."""
        node_map = {
            "reshape": "n8n-nodes-base.set",
            "flatten": "n8n-nodes-base.code",
            "nest": "n8n-nodes-base.code",
            "map": "n8n-nodes-base.set",
            "filter": "n8n-nodes-base.filter",
            "group": "n8n-nodes-base.aggregate",
            "aggregate": "n8n-nodes-base.aggregate",
            "join": "n8n-nodes-base.merge",
            "split": "n8n-nodes-base.splitOut",
            "pivot": "n8n-nodes-base.code",
            "unpivot": "n8n-nodes-base.code",
            "deduplicate": "n8n-nodes-base.removeDuplicates",
            "sort": "n8n-nodes-base.sort",
            "rename": "n8n-nodes-base.renameKeys"
        }
        return node_map.get(self.value, "n8n-nodes-base.code")

    @property
    def complexity(self) -> int:
        """Complexity score 1-10."""
        scores = {
            "reshape": 3, "flatten": 5, "nest": 6, "map": 2,
            "filter": 2, "group": 5, "aggregate": 6, "join": 7,
            "split": 3, "pivot": 8, "unpivot": 7, "deduplicate": 3,
            "sort": 2, "rename": 1
        }
        return scores.get(self.value, 5)


class AggregateFunction(Enum):
    """Aggregation function types."""
    COUNT = "count"
    SUM = "sum"
    AVG = "average"
    MIN = "min"
    MAX = "max"
    FIRST = "first"
    LAST = "last"
    CONCAT = "concatenate"
    UNIQUE = "unique_count"
    MEDIAN = "median"

    @property
    def n8n_operation(self) -> str:
        """n8n aggregate node operation name."""
        op_map = {
            "count": "count",
            "sum": "sum",
            "average": "average",
            "min": "min",
            "max": "max",
            "first": "firstItem",
            "last": "lastItem",
            "concatenate": "concatenate",
            "unique_count": "countUnique",
            "median": "median"
        }
        return op_map.get(self.value, self.value)


class DataType(Enum):
    """Data type classifications."""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    ARRAY = "array"
    OBJECT = "object"
    NULL = "null"
    MIXED = "mixed"

    @classmethod
    def detect(cls, value: Any) -> "DataType":
        """Detect data type from value."""
        if value is None:
            return cls.NULL
        if isinstance(value, bool):
            return cls.BOOLEAN
        if isinstance(value, (int, float)):
            return cls.NUMBER
        if isinstance(value, str):
            # Check for date patterns
            date_patterns = [
                r'^\d{4}-\d{2}-\d{2}',
                r'^\d{2}/\d{2}/\d{4}',
                r'^\d{4}/\d{2}/\d{2}'
            ]
            for pattern in date_patterns:
                if re.match(pattern, value):
                    return cls.DATE
            return cls.STRING
        if isinstance(value, list):
            return cls.ARRAY
        if isinstance(value, dict):
            return cls.OBJECT
        return cls.MIXED


class JoinType(Enum):
    """Join operation types."""
    INNER = "inner"
    LEFT = "left"
    RIGHT = "right"
    OUTER = "outer"
    APPEND = "append"

    @property
    def n8n_mode(self) -> str:
        """n8n merge node mode."""
        mode_map = {
            "inner": "combine",
            "left": "combine",
            "right": "combine",
            "outer": "combine",
            "append": "append"
        }
        return mode_map.get(self.value, "combine")


class DateFormat(Enum):
    """Common date format patterns."""
    ISO = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    DATE_ONLY = "yyyy-MM-dd"
    US_DATE = "MM/dd/yyyy"
    EU_DATE = "dd/MM/yyyy"
    TIMESTAMP = "timestamp"
    RELATIVE = "relative"
    CUSTOM = "custom"

    @property
    def luxon_format(self) -> str:
        """Luxon format string for n8n."""
        formats = {
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'": "iso",
            "yyyy-MM-dd": "yyyy-MM-dd",
            "MM/dd/yyyy": "MM/dd/yyyy",
            "dd/MM/yyyy": "dd/MM/yyyy",
            "timestamp": "x",
            "relative": "relative"
        }
        return formats.get(self.value, self.value)


# ============================================================================
# DATACLASSES - Transformation Configurations
# ============================================================================

@dataclass
class FieldMapping:
    """Field mapping configuration."""
    source_field: str
    target_field: str
    transform: Optional[str] = None  # Expression or function
    default_value: Any = None
    data_type: Optional[DataType] = None

    def to_n8n_expression(self) -> str:
        """Generate n8n expression for this mapping."""
        base = f"$json.{self.source_field}"

        if self.default_value is not None:
            if isinstance(self.default_value, str):
                base = f"({base} ?? '{self.default_value}')"
            else:
                base = f"({base} ?? {self.default_value})"

        if self.transform:
            base = self.transform.replace("$value", base)

        return f"={{{{ {base} }}}}"


@dataclass
class FlattenConfig:
    """Configuration for flattening nested objects."""
    delimiter: str = "_"
    max_depth: int = 10
    array_notation: str = "index"  # index, bracket, or flatten
    preserve_arrays: bool = False
    exclude_paths: list = field(default_factory=list)

    def generate_code(self) -> str:
        """Generate n8n Code node for flattening."""
        return f'''// Flatten nested objects
const flatten = (obj, prefix = '', depth = 0) => {{
  if (depth > {self.max_depth}) return {{ [prefix]: obj }};

  return Object.keys(obj).reduce((acc, key) => {{
    const fullKey = prefix ? `${{prefix}}{self.delimiter}${{key}}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {{
      Object.assign(acc, flatten(value, fullKey, depth + 1));
    }} else if (Array.isArray(value) && !{str(self.preserve_arrays).lower()}) {{
      value.forEach((item, idx) => {{
        if (typeof item === 'object') {{
          Object.assign(acc, flatten(item, `${{fullKey}}{self.delimiter}${{idx}}`, depth + 1));
        }} else {{
          acc[`${{fullKey}}{self.delimiter}${{idx}}`] = item;
        }}
      }});
    }} else {{
      acc[fullKey] = value;
    }}

    return acc;
  }}, {{}});
}};

return $input.all().map(item => ({{
  json: flatten(item.json)
}}));'''


@dataclass
class GroupConfig:
    """Configuration for grouping operations."""
    group_by: list = field(default_factory=list)
    aggregations: dict = field(default_factory=dict)  # field -> AggregateFunction
    include_items: bool = False
    output_format: str = "flat"  # flat or nested

    def to_n8n_config(self) -> dict:
        """Generate n8n Aggregate node configuration."""
        return {
            "aggregate": "aggregateAllItemData",
            "options": {
                "outputFormat": self.output_format
            },
            "fieldsToGroupBy": ",".join(self.group_by),
            "fieldsToAggregate": [
                {
                    "fieldToAggregate": field,
                    "aggregation": func.n8n_operation if isinstance(func, AggregateFunction) else func
                }
                for field, func in self.aggregations.items()
            ]
        }


@dataclass
class JoinConfig:
    """Configuration for join operations."""
    join_type: JoinType = JoinType.INNER
    left_key: str = "id"
    right_key: str = "id"
    output_fields: str = "all"  # all, left, right, or specific fields
    clash_handling: str = "preferInput1"  # preferInput1, preferInput2, addSuffix

    def to_n8n_config(self) -> dict:
        """Generate n8n Merge node configuration."""
        return {
            "mode": self.join_type.n8n_mode,
            "mergeByFields": {
                "values": [
                    {"field1": self.left_key, "field2": self.right_key}
                ]
            },
            "joinMode": self.join_type.value if self.join_type != JoinType.APPEND else "keepEverything",
            "options": {
                "clashHandling": {
                    "values": {"resolveClash": self.clash_handling}
                }
            }
        }


@dataclass
class PivotConfig:
    """Configuration for pivot operations."""
    row_fields: list = field(default_factory=list)
    pivot_field: str = ""
    value_field: str = ""
    aggregate_func: AggregateFunction = AggregateFunction.SUM
    fill_value: Any = 0

    def generate_code(self) -> str:
        """Generate n8n Code node for pivot."""
        return f'''// Pivot transformation
const items = $input.all();
const pivotField = '{self.pivot_field}';
const valueField = '{self.value_field}';
const rowFields = {json.dumps(self.row_fields)};
const fillValue = {json.dumps(self.fill_value)};

// Get unique pivot values
const pivotValues = [...new Set(items.map(i => i.json[pivotField]))];

// Group by row fields
const grouped = {{}};
items.forEach(item => {{
  const key = rowFields.map(f => item.json[f]).join('|');
  if (!grouped[key]) {{
    grouped[key] = {{ _row: {{}}, _values: {{}} }};
    rowFields.forEach(f => grouped[key]._row[f] = item.json[f]);
  }}
  const pivotVal = item.json[pivotField];
  const val = item.json[valueField] || 0;

  // Aggregate: {self.aggregate_func.value}
  if (!grouped[key]._values[pivotVal]) {{
    grouped[key]._values[pivotVal] = {self.aggregate_func.value === 'count' ? '0' : 'val'};
  }}
  {'grouped[key]._values[pivotVal]++;' if self.aggregate_func == AggregateFunction.COUNT else 'grouped[key]._values[pivotVal] += val;'}
}});

// Build output
return Object.values(grouped).map(g => {{
  const row = {{ ...g._row }};
  pivotValues.forEach(pv => {{
    row[pv] = g._values[pv] ?? fillValue;
  }});
  return {{ json: row }};
}});'''


@dataclass
class TransformStep:
    """Single transformation step in a pipeline."""
    step_id: str
    transform_type: TransformType
    config: dict = field(default_factory=dict)
    input_fields: list = field(default_factory=list)
    output_fields: list = field(default_factory=list)
    description: str = ""

    def to_n8n_node(self, position: tuple = (0, 0)) -> dict:
        """Generate n8n node configuration."""
        return {
            "id": self.step_id,
            "name": self.description or f"{self.transform_type.value.title()} Transform",
            "type": self.transform_type.n8n_node,
            "position": list(position),
            "parameters": self.config
        }


@dataclass
class TransformPipeline:
    """Complete transformation pipeline."""
    pipeline_id: str
    name: str
    steps: list = field(default_factory=list)
    input_schema: dict = field(default_factory=dict)
    output_schema: dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def add_step(self, step: TransformStep) -> "TransformPipeline":
        """Add a transformation step."""
        self.steps.append(step)
        return self

    def to_n8n_workflow(self) -> dict:
        """Generate complete n8n workflow."""
        nodes = []
        connections = {}

        # Add manual trigger
        nodes.append({
            "id": "trigger",
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "position": [0, 0]
        })

        prev_node = "trigger"
        for i, step in enumerate(self.steps):
            position = ((i + 1) * 250, 0)
            node = step.to_n8n_node(position)
            nodes.append(node)

            connections[prev_node] = {
                "main": [[{"node": step.step_id, "type": "main", "index": 0}]]
            }
            prev_node = step.step_id

        return {
            "name": self.name,
            "nodes": nodes,
            "connections": connections,
            "settings": {"executionOrder": "v1"}
        }


# ============================================================================
# ENGINE CLASSES - Transformation Processors
# ============================================================================

class ShapeShifter:
    """Object restructuring and field mapping engine."""

    def __init__(self):
        self.mappings: list[FieldMapping] = []

    def add_mapping(self, source: str, target: str,
                    transform: str = None, default: Any = None) -> "ShapeShifter":
        """Add a field mapping."""
        self.mappings.append(FieldMapping(
            source_field=source,
            target_field=target,
            transform=transform,
            default_value=default
        ))
        return self

    def flatten(self, data: dict, config: FlattenConfig = None) -> dict:
        """Flatten nested object."""
        config = config or FlattenConfig()

        def _flatten(obj, prefix="", depth=0):
            if depth > config.max_depth:
                return {prefix: obj}

            result = {}
            for key, value in obj.items():
                full_key = f"{prefix}{config.delimiter}{key}" if prefix else key

                if full_key in config.exclude_paths:
                    result[full_key] = value
                elif isinstance(value, dict):
                    result.update(_flatten(value, full_key, depth + 1))
                elif isinstance(value, list) and not config.preserve_arrays:
                    for idx, item in enumerate(value):
                        if isinstance(item, dict):
                            result.update(_flatten(item, f"{full_key}{config.delimiter}{idx}", depth + 1))
                        else:
                            result[f"{full_key}{config.delimiter}{idx}"] = item
                else:
                    result[full_key] = value

            return result

        return _flatten(data)

    def nest(self, data: dict, delimiter: str = "_") -> dict:
        """Nest flat object based on delimiter."""
        result = {}

        for key, value in data.items():
            parts = key.split(delimiter)
            current = result

            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]

            current[parts[-1]] = value

        return result

    def reshape(self, data: dict) -> dict:
        """Apply all mappings to reshape data."""
        result = {}

        for mapping in self.mappings:
            # Navigate source path
            value = data
            for part in mapping.source_field.split("."):
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                    break

            # Apply default if needed
            if value is None:
                value = mapping.default_value

            # Apply transform expression (simplified)
            if mapping.transform and value is not None:
                # Handle simple transforms
                if mapping.transform == "upper":
                    value = str(value).upper()
                elif mapping.transform == "lower":
                    value = str(value).lower()
                elif mapping.transform == "trim":
                    value = str(value).strip()
                elif mapping.transform.startswith("toFixed("):
                    decimals = int(mapping.transform[8:-1])
                    value = round(float(value), decimals)

            # Set target path
            target_parts = mapping.target_field.split(".")
            current = result
            for part in target_parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            current[target_parts[-1]] = value

        return result

    def generate_set_node(self, mode: str = "manual") -> dict:
        """Generate n8n Set node configuration."""
        assignments = []

        for mapping in self.mappings:
            assignments.append({
                "name": mapping.target_field,
                "value": mapping.to_n8n_expression(),
                "type": mapping.data_type.value if mapping.data_type else "string"
            })

        return {
            "mode": mode,
            "duplicateItem": False,
            "assignments": {"assignments": assignments}
        }


class AggregationEngine:
    """Data aggregation and grouping engine."""

    AGGREGATE_FUNCS = {
        "count": lambda values: len(values),
        "sum": lambda values: sum(v for v in values if isinstance(v, (int, float))),
        "average": lambda values: sum(v for v in values if isinstance(v, (int, float))) / len([v for v in values if isinstance(v, (int, float))]) if values else 0,
        "min": lambda values: min((v for v in values if isinstance(v, (int, float))), default=None),
        "max": lambda values: max((v for v in values if isinstance(v, (int, float))), default=None),
        "first": lambda values: values[0] if values else None,
        "last": lambda values: values[-1] if values else None,
        "concatenate": lambda values: ", ".join(str(v) for v in values),
        "unique_count": lambda values: len(set(values))
    }

    def group_by(self, items: list[dict], group_fields: list[str],
                 aggregations: dict = None) -> list[dict]:
        """Group items by fields and aggregate."""
        groups = {}

        for item in items:
            # Create group key
            key_parts = [str(item.get(f, "")) for f in group_fields]
            key = "|".join(key_parts)

            if key not in groups:
                groups[key] = {
                    "_key": {f: item.get(f) for f in group_fields},
                    "_items": []
                }
            groups[key]["_items"].append(item)

        # Apply aggregations
        result = []
        for group in groups.values():
            row = dict(group["_key"])
            row["count"] = len(group["_items"])

            if aggregations:
                for field, func_name in aggregations.items():
                    values = [item.get(field) for item in group["_items"]]
                    func = self.AGGREGATE_FUNCS.get(func_name, lambda x: x)
                    row[f"{field}_{func_name}"] = func(values)

            result.append(row)

        return result

    def deduplicate(self, items: list[dict], key_fields: list[str],
                    keep: str = "first") -> list[dict]:
        """Remove duplicate items based on key fields."""
        seen = {}
        result = []

        for item in items:
            key = "|".join(str(item.get(f, "")) for f in key_fields)

            if key not in seen:
                seen[key] = item
                if keep == "first":
                    result.append(item)
            elif keep == "last":
                # Update the seen item
                seen[key] = item

        if keep == "last":
            result = list(seen.values())

        return result

    def pivot(self, items: list[dict], config: PivotConfig) -> list[dict]:
        """Pivot data from rows to columns."""
        # Get unique pivot values
        pivot_values = list(set(item.get(config.pivot_field) for item in items))

        # Group by row fields
        groups = {}
        for item in items:
            key = "|".join(str(item.get(f, "")) for f in config.row_fields)

            if key not in groups:
                groups[key] = {
                    "_row": {f: item.get(f) for f in config.row_fields},
                    "_values": {}
                }

            pivot_val = item.get(config.pivot_field)
            data_val = item.get(config.value_field, 0)

            if pivot_val not in groups[key]["_values"]:
                groups[key]["_values"][pivot_val] = []
            groups[key]["_values"][pivot_val].append(data_val)

        # Build output with aggregation
        result = []
        agg_func = self.AGGREGATE_FUNCS.get(config.aggregate_func.value, lambda x: sum(x))

        for group in groups.values():
            row = dict(group["_row"])
            for pv in pivot_values:
                values = group["_values"].get(pv, [])
                row[str(pv)] = agg_func(values) if values else config.fill_value
            result.append(row)

        return result

    def unpivot(self, items: list[dict], id_fields: list[str],
                value_fields: list[str],
                name_col: str = "attribute",
                value_col: str = "value") -> list[dict]:
        """Unpivot data from columns to rows."""
        result = []

        for item in items:
            base = {f: item.get(f) for f in id_fields}

            for field in value_fields:
                row = dict(base)
                row[name_col] = field
                row[value_col] = item.get(field)
                result.append(row)

        return result

    def generate_aggregate_node(self, config: GroupConfig) -> dict:
        """Generate n8n Aggregate node configuration."""
        return config.to_n8n_config()


class StringProcessor:
    """String manipulation and text processing engine."""

    def parse_template(self, template: str, data: dict) -> str:
        """Parse template string with data substitution."""
        result = template

        # Handle {{ field }} syntax
        pattern = r'\{\{\s*(\w+(?:\.\w+)*)\s*\}\}'

        def replace_field(match):
            field_path = match.group(1)
            value = data
            for part in field_path.split("."):
                if isinstance(value, dict):
                    value = value.get(part, "")
                else:
                    value = ""
                    break
            return str(value)

        return re.sub(pattern, replace_field, result)

    def extract_regex(self, text: str, pattern: str,
                      group: int = 0, flags: int = 0) -> Optional[str]:
        """Extract text using regex pattern."""
        match = re.search(pattern, text, flags)
        if match:
            try:
                return match.group(group)
            except IndexError:
                return match.group(0)
        return None

    def split_to_array(self, text: str, delimiter: str = ",",
                       trim: bool = True) -> list[str]:
        """Split string to array."""
        parts = text.split(delimiter)
        if trim:
            parts = [p.strip() for p in parts]
        return parts

    def generate_expression(self, operation: str, field: str, **kwargs) -> str:
        """Generate n8n expression for string operation."""
        expressions = {
            "upper": f"={{{{ $json.{field}.toUpperCase() }}}}",
            "lower": f"={{{{ $json.{field}.toLowerCase() }}}}",
            "trim": f"={{{{ $json.{field}.trim() }}}}",
            "length": f"={{{{ $json.{field}.length }}}}",
            "replace": f"={{{{ $json.{field}.replace('{kwargs.get('find', '')}', '{kwargs.get('replace', '')}') }}}}",
            "slice": f"={{{{ $json.{field}.slice({kwargs.get('start', 0)}, {kwargs.get('end', '')}) }}}}",
            "split": f"={{{{ $json.{field}.split('{kwargs.get('delimiter', ',')}') }}}}",
            "concat": f"={{{{ $json.{field} + '{kwargs.get('suffix', '')}' }}}}",
            "prefix": f"={{{{ '{kwargs.get('prefix', '')}' + $json.{field} }}}}"
        }
        return expressions.get(operation, f"={{{{ $json.{field} }}}}")


class DateTimeHandler:
    """Date and time transformation engine."""

    DATE_PATTERNS = {
        "iso": r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',
        "date_only": r'^\d{4}-\d{2}-\d{2}$',
        "us_date": r'^\d{2}/\d{2}/\d{4}$',
        "eu_date": r'^\d{2}/\d{2}/\d{4}$',
        "timestamp": r'^\d{10,13}$'
    }

    def detect_format(self, date_str: str) -> Optional[str]:
        """Detect date format from string."""
        for format_name, pattern in self.DATE_PATTERNS.items():
            if re.match(pattern, date_str):
                return format_name
        return None

    def generate_conversion(self, source_format: str, target_format: str,
                            field: str) -> str:
        """Generate n8n expression for date conversion."""
        # Using Luxon (n8n's date library)
        if source_format == "iso":
            parse = f"DateTime.fromISO($json.{field})"
        elif source_format == "timestamp":
            parse = f"DateTime.fromMillis(parseInt($json.{field}))"
        elif source_format == "us_date":
            parse = f"DateTime.fromFormat($json.{field}, 'MM/dd/yyyy')"
        elif source_format == "eu_date":
            parse = f"DateTime.fromFormat($json.{field}, 'dd/MM/yyyy')"
        else:
            parse = f"DateTime.fromISO($json.{field})"

        if target_format == "iso":
            format_expr = ".toISO()"
        elif target_format == "date_only":
            format_expr = ".toFormat('yyyy-MM-dd')"
        elif target_format == "us_date":
            format_expr = ".toFormat('MM/dd/yyyy')"
        elif target_format == "timestamp":
            format_expr = ".toMillis()"
        else:
            format_expr = f".toFormat('{target_format}')"

        return f"={{{{ {parse}{format_expr} }}}}"

    def generate_date_math(self, field: str, operation: str,
                           amount: int, unit: str) -> str:
        """Generate n8n expression for date math."""
        if operation == "add":
            return f"={{{{ DateTime.fromISO($json.{field}).plus({{ {unit}: {amount} }}).toISO() }}}}"
        elif operation == "subtract":
            return f"={{{{ DateTime.fromISO($json.{field}).minus({{ {unit}: {amount} }}).toISO() }}}}"
        elif operation == "diff":
            return f"={{{{ DateTime.fromISO($json.{field}).diffNow('{unit}').{unit} }}}}"
        elif operation == "start_of":
            return f"={{{{ DateTime.fromISO($json.{field}).startOf('{unit}').toISO() }}}}"
        elif operation == "end_of":
            return f"={{{{ DateTime.fromISO($json.{field}).endOf('{unit}').toISO() }}}}"
        return f"={{{{ $json.{field} }}}}"

    def generate_relative_date(self, description: str) -> str:
        """Generate expression for relative date descriptions."""
        descriptions = {
            "today": "={{ DateTime.now().startOf('day').toISO() }}",
            "yesterday": "={{ DateTime.now().minus({ days: 1 }).startOf('day').toISO() }}",
            "tomorrow": "={{ DateTime.now().plus({ days: 1 }).startOf('day').toISO() }}",
            "this_week_start": "={{ DateTime.now().startOf('week').toISO() }}",
            "this_month_start": "={{ DateTime.now().startOf('month').toISO() }}",
            "this_year_start": "={{ DateTime.now().startOf('year').toISO() }}",
            "last_7_days": "={{ DateTime.now().minus({ days: 7 }).toISO() }}",
            "last_30_days": "={{ DateTime.now().minus({ days: 30 }).toISO() }}",
            "last_quarter": "={{ DateTime.now().minus({ months: 3 }).toISO() }}"
        }
        return descriptions.get(description, "={{ DateTime.now().toISO() }}")


class TransformOrchestrator:
    """Main orchestrator for transformation pipelines."""

    def __init__(self):
        self.shape_shifter = ShapeShifter()
        self.aggregation = AggregationEngine()
        self.string_proc = StringProcessor()
        self.datetime_handler = DateTimeHandler()

    def analyze_schema(self, sample_data: dict) -> dict:
        """Analyze data schema from sample."""
        def analyze_value(value, path=""):
            if value is None:
                return {"type": "null", "path": path}

            dtype = DataType.detect(value)

            if dtype == DataType.OBJECT:
                return {
                    "type": "object",
                    "path": path,
                    "properties": {
                        k: analyze_value(v, f"{path}.{k}" if path else k)
                        for k, v in value.items()
                    }
                }
            elif dtype == DataType.ARRAY:
                return {
                    "type": "array",
                    "path": path,
                    "items": analyze_value(value[0], f"{path}[]") if value else {"type": "unknown"}
                }
            else:
                return {
                    "type": dtype.value,
                    "path": path,
                    "sample": value
                }

        return analyze_value(sample_data)

    def suggest_transforms(self, input_schema: dict,
                          output_schema: dict) -> list[TransformStep]:
        """Suggest transformation steps based on schemas."""
        steps = []

        # Analyze differences
        input_flat = self._flatten_schema(input_schema)
        output_flat = self._flatten_schema(output_schema)

        # Check for renamed fields
        renames = []
        for out_path, out_info in output_flat.items():
            for in_path, in_info in input_flat.items():
                if in_info.get("type") == out_info.get("type") and in_path != out_path:
                    # Potential rename
                    renames.append((in_path, out_path))

        if renames:
            steps.append(TransformStep(
                step_id=f"rename_{len(steps)}",
                transform_type=TransformType.RENAME,
                description="Rename fields",
                config={"renameKeys": renames}
            ))

        return steps

    def _flatten_schema(self, schema: dict, prefix: str = "") -> dict:
        """Flatten nested schema for comparison."""
        result = {}

        if schema.get("type") == "object" and "properties" in schema:
            for key, value in schema["properties"].items():
                full_path = f"{prefix}.{key}" if prefix else key
                result.update(self._flatten_schema(value, full_path))
        else:
            result[prefix or "root"] = schema

        return result

    def build_pipeline(self, name: str,
                       transforms: list[dict]) -> TransformPipeline:
        """Build a transformation pipeline from specifications."""
        pipeline = TransformPipeline(
            pipeline_id=hashlib.md5(name.encode()).hexdigest()[:8],
            name=name
        )

        for i, t in enumerate(transforms):
            transform_type = TransformType(t.get("type", "reshape"))

            step = TransformStep(
                step_id=f"step_{i}",
                transform_type=transform_type,
                config=t.get("config", {}),
                description=t.get("description", f"Step {i+1}")
            )
            pipeline.add_step(step)

        return pipeline

    def execute_pipeline(self, pipeline: TransformPipeline,
                         data: list[dict]) -> list[dict]:
        """Execute transformation pipeline on data."""
        result = data

        for step in pipeline.steps:
            if step.transform_type == TransformType.FLATTEN:
                config = FlattenConfig(**step.config)
                result = [self.shape_shifter.flatten(item, config) for item in result]

            elif step.transform_type == TransformType.GROUP:
                group_config = GroupConfig(**step.config)
                result = self.aggregation.group_by(
                    result,
                    group_config.group_by,
                    group_config.aggregations
                )

            elif step.transform_type == TransformType.DEDUPE:
                result = self.aggregation.deduplicate(
                    result,
                    step.config.get("key_fields", []),
                    step.config.get("keep", "first")
                )

            elif step.transform_type == TransformType.PIVOT:
                pivot_config = PivotConfig(**step.config)
                result = self.aggregation.pivot(result, pivot_config)

            elif step.transform_type == TransformType.FILTER:
                field = step.config.get("field")
                op = step.config.get("operation", "equals")
                value = step.config.get("value")

                if op == "equals":
                    result = [item for item in result if item.get(field) == value]
                elif op == "not_equals":
                    result = [item for item in result if item.get(field) != value]
                elif op == "contains":
                    result = [item for item in result if value in str(item.get(field, ""))]
                elif op == "greater_than":
                    result = [item for item in result if (item.get(field) or 0) > value]
                elif op == "less_than":
                    result = [item for item in result if (item.get(field) or 0) < value]

            elif step.transform_type == TransformType.SORT:
                field = step.config.get("field")
                descending = step.config.get("descending", False)
                result = sorted(result, key=lambda x: x.get(field, ""), reverse=descending)

        return result


# ============================================================================
# REPORTER CLASS - ASCII Dashboard Generation
# ============================================================================

class TransformReporter:
    """ASCII dashboard reporter for transformations."""

    @staticmethod
    def generate_progress_bar(value: int, max_val: int = 10, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_val) * width)
        return "█" * filled + "░" * (width - filled)

    def report_pipeline(self, pipeline: TransformPipeline) -> str:
        """Generate pipeline report."""
        total_complexity = sum(s.transform_type.complexity for s in pipeline.steps)
        avg_complexity = total_complexity // len(pipeline.steps) if pipeline.steps else 0

        report = f"""
TRANSFORM PIPELINE
═══════════════════════════════════════════════════════
Pipeline: {pipeline.name}
ID: {pipeline.pipeline_id}
Created: {pipeline.created_at[:19]}
═══════════════════════════════════════════════════════

PIPELINE OVERVIEW
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│       TRANSFORMATION PIPELINE                       │
│                                                     │
│  Steps: {len(pipeline.steps):<3}                                         │
│  Complexity: {self.generate_progress_bar(avg_complexity)} {avg_complexity}/10  │
│                                                     │
│  Transforms:                                        │"""

        for step in pipeline.steps:
            report += f"\n│  • {step.description[:40]:<40} │"

        report += """
│                                                     │
│  Status: [●] Pipeline Ready                         │
└─────────────────────────────────────────────────────┘

PIPELINE STEPS
────────────────────────────────────────────────────────
| # | Type | Node | Complexity |
|---|------|------|------------|"""

        for i, step in enumerate(pipeline.steps, 1):
            report += f"\n| {i} | {step.transform_type.value[:15]:<15} | {step.transform_type.n8n_node.split('.')[-1]:<12} | {self.generate_progress_bar(step.transform_type.complexity, 10, 5)} |"

        return report

    def report_schema_analysis(self, schema: dict) -> str:
        """Generate schema analysis report."""

        def count_fields(s: dict) -> tuple[int, int]:
            """Count total fields and nested depth."""
            if s.get("type") == "object" and "properties" in s:
                total = 0
                max_depth = 1
                for prop in s["properties"].values():
                    child_count, child_depth = count_fields(prop)
                    total += child_count
                    max_depth = max(max_depth, child_depth + 1)
                return total, max_depth
            return 1, 0

        field_count, depth = count_fields(schema)

        report = f"""
SCHEMA ANALYSIS
═══════════════════════════════════════════════════════

STRUCTURE OVERVIEW
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│       SCHEMA METRICS                                │
│                                                     │
│  Total Fields: {field_count:<3}                                     │
│  Max Depth: {depth:<3}                                         │
│  Root Type: {schema.get('type', 'unknown'):<10}                            │
│                                                     │
│  Complexity: {self.generate_progress_bar(min(depth * 2 + field_count // 5, 10))} │
└─────────────────────────────────────────────────────┘
"""
        return report

    def report_transform_result(self, input_count: int, output_count: int,
                                transform_type: str) -> str:
        """Generate transformation result report."""
        ratio = output_count / input_count if input_count > 0 else 0

        report = f"""
TRANSFORMATION RESULT
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│       TRANSFORM COMPLETE                            │
│                                                     │
│  Type: {transform_type:<20}                       │
│                                                     │
│  Input Items:  {input_count:<6}                                 │
│  Output Items: {output_count:<6}                                 │
│  Ratio: {ratio:.2f}x                                       │
│                                                     │
│  Status: [●] Transform Successful                   │
└─────────────────────────────────────────────────────┘
"""
        return report


# ============================================================================
# CLI INTERFACE
# ============================================================================

def create_parser() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-transform",
        description="N8N.TRANSFORM.EXE - Data Transformation Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Flatten command
    flatten_parser = subparsers.add_parser("flatten", help="Flatten nested objects")
    flatten_parser.add_argument("--delimiter", "-d", default="_", help="Delimiter for keys")
    flatten_parser.add_argument("--max-depth", "-m", type=int, default=10, help="Max nesting depth")
    flatten_parser.add_argument("--preserve-arrays", "-a", action="store_true", help="Keep arrays intact")
    flatten_parser.add_argument("--input", "-i", help="Input JSON file")

    # Group command
    group_parser = subparsers.add_parser("group", help="Group and aggregate data")
    group_parser.add_argument("--by", "-b", required=True, help="Fields to group by (comma-separated)")
    group_parser.add_argument("--sum", "-s", help="Fields to sum")
    group_parser.add_argument("--count", "-c", action="store_true", help="Include count")
    group_parser.add_argument("--input", "-i", help="Input JSON file")

    # Join command
    join_parser = subparsers.add_parser("join", help="Join two datasets")
    join_parser.add_argument("--type", "-t", choices=["inner", "left", "right", "outer"], default="inner")
    join_parser.add_argument("--left-key", "-l", required=True, help="Left join key")
    join_parser.add_argument("--right-key", "-r", required=True, help="Right join key")
    join_parser.add_argument("--left-file", required=True, help="Left input file")
    join_parser.add_argument("--right-file", required=True, help="Right input file")

    # Pivot command
    pivot_parser = subparsers.add_parser("pivot", help="Pivot data")
    pivot_parser.add_argument("--rows", "-r", required=True, help="Row fields (comma-separated)")
    pivot_parser.add_argument("--pivot", "-p", required=True, help="Pivot column field")
    pivot_parser.add_argument("--value", "-v", required=True, help="Value field")
    pivot_parser.add_argument("--agg", "-a", choices=["sum", "count", "avg", "min", "max"], default="sum")
    pivot_parser.add_argument("--input", "-i", help="Input JSON file")

    # Expression command
    expr_parser = subparsers.add_parser("expression", help="Generate n8n expressions")
    expr_parser.add_argument("--type", "-t", required=True,
                            choices=["string", "date", "math", "conditional"])
    expr_parser.add_argument("--field", "-f", required=True, help="Source field")
    expr_parser.add_argument("--operation", "-o", help="Operation to perform")
    expr_parser.add_argument("--params", "-p", help="Additional parameters (JSON)")

    # Pipeline command
    pipeline_parser = subparsers.add_parser("pipeline", help="Build transformation pipeline")
    pipeline_parser.add_argument("--name", "-n", required=True, help="Pipeline name")
    pipeline_parser.add_argument("--steps", "-s", required=True, help="Steps JSON file")
    pipeline_parser.add_argument("--output", "-o", help="Output workflow file")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def run_demo():
    """Run demonstration of transformation capabilities."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║           N8N.TRANSFORM.EXE - DEMONSTRATION                   ║
╚═══════════════════════════════════════════════════════════════╝
""")

    # Sample data
    sample_data = [
        {"user": {"name": "Alice", "email": "alice@example.com"}, "orders": [{"id": 1, "amount": 100}]},
        {"user": {"name": "Bob", "email": "bob@example.com"}, "orders": [{"id": 2, "amount": 200}]}
    ]

    print("1. FLATTEN TRANSFORMATION")
    print("─" * 50)

    shifter = ShapeShifter()
    config = FlattenConfig(delimiter="_")

    for item in sample_data:
        flat = shifter.flatten(item, config)
        print(f"Input: {json.dumps(item)[:60]}...")
        print(f"Output: {json.dumps(flat)}")
        print()

    print("\n2. GROUP & AGGREGATE")
    print("─" * 50)

    sales_data = [
        {"category": "Electronics", "product": "Phone", "sales": 500},
        {"category": "Electronics", "product": "Laptop", "sales": 1200},
        {"category": "Clothing", "product": "Shirt", "sales": 50},
        {"category": "Clothing", "product": "Pants", "sales": 80}
    ]

    engine = AggregationEngine()
    grouped = engine.group_by(sales_data, ["category"], {"sales": "sum"})

    print(f"Input: {len(sales_data)} items")
    print(f"Grouped by category with sum:")
    for row in grouped:
        print(f"  {row}")

    print("\n3. EXPRESSION GENERATION")
    print("─" * 50)

    string_proc = StringProcessor()
    date_handler = DateTimeHandler()

    expressions = {
        "Upper case name": string_proc.generate_expression("upper", "name"),
        "Trim whitespace": string_proc.generate_expression("trim", "description"),
        "Format date": date_handler.generate_conversion("iso", "us_date", "created_at"),
        "Add 7 days": date_handler.generate_date_math("due_date", "add", 7, "days"),
        "Relative date": date_handler.generate_relative_date("last_30_days")
    }

    for name, expr in expressions.items():
        print(f"{name}:")
        print(f"  {expr}")
        print()

    print("\n4. PIPELINE GENERATION")
    print("─" * 50)

    orchestrator = TransformOrchestrator()

    pipeline = orchestrator.build_pipeline("sales_analysis", [
        {"type": "flatten", "description": "Flatten nested data"},
        {"type": "group", "config": {"group_by": ["category"], "aggregations": {"sales": "sum"}}, "description": "Group by category"},
        {"type": "sort", "config": {"field": "sales_sum", "descending": True}, "description": "Sort by sales"}
    ])

    reporter = TransformReporter()
    print(reporter.report_pipeline(pipeline))

    print("\n5. N8N WORKFLOW OUTPUT")
    print("─" * 50)

    workflow = pipeline.to_n8n_workflow()
    print(json.dumps(workflow, indent=2)[:500] + "...")

    print("""
╔═══════════════════════════════════════════════════════════════╗
║                    DEMO COMPLETE                              ║
╚═══════════════════════════════════════════════════════════════╝

Available commands:
  n8n-transform flatten --input data.json --delimiter "_"
  n8n-transform group --by "category" --sum "amount" --input data.json
  n8n-transform pivot --rows "date" --pivot "product" --value "sales"
  n8n-transform expression --type date --field created_at --operation add
  n8n-transform pipeline --name "my_pipeline" --steps steps.json
""")


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    if args.command == "demo":
        run_demo()
    elif args.command == "flatten":
        config = FlattenConfig(
            delimiter=args.delimiter,
            max_depth=args.max_depth,
            preserve_arrays=args.preserve_arrays
        )
        print("Flatten Configuration:")
        print(f"  Delimiter: {config.delimiter}")
        print(f"  Max Depth: {config.max_depth}")
        print(f"  Preserve Arrays: {config.preserve_arrays}")
        print("\nGenerated Code Node:")
        print(config.generate_code())
    elif args.command == "group":
        group_fields = [f.strip() for f in args.by.split(",")]
        aggregations = {}
        if args.sum:
            for field in args.sum.split(","):
                aggregations[field.strip()] = "sum"

        config = GroupConfig(
            group_by=group_fields,
            aggregations=aggregations
        )
        print("Group Configuration:")
        print(f"  Group By: {config.group_by}")
        print(f"  Aggregations: {config.aggregations}")
        print("\nN8N Node Config:")
        print(json.dumps(config.to_n8n_config(), indent=2))
    elif args.command == "expression":
        if args.type == "string":
            proc = StringProcessor()
            params = json.loads(args.params) if args.params else {}
            expr = proc.generate_expression(args.operation or "upper", args.field, **params)
            print(f"Expression: {expr}")
        elif args.type == "date":
            handler = DateTimeHandler()
            params = json.loads(args.params) if args.params else {}
            if args.operation in ["add", "subtract"]:
                expr = handler.generate_date_math(
                    args.field, args.operation,
                    params.get("amount", 1), params.get("unit", "days")
                )
            else:
                expr = handler.generate_conversion(
                    params.get("source", "iso"),
                    params.get("target", "date_only"),
                    args.field
                )
            print(f"Expression: {expr}")
    elif args.command == "pipeline":
        with open(args.steps) as f:
            steps = json.load(f)

        orchestrator = TransformOrchestrator()
        pipeline = orchestrator.build_pipeline(args.name, steps)

        workflow = pipeline.to_n8n_workflow()

        if args.output:
            with open(args.output, "w") as f:
                json.dump(workflow, f, indent=2)
            print(f"Workflow saved to {args.output}")
        else:
            print(json.dumps(workflow, indent=2))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK REFERENCE

### Transformation Nodes

| Node | Best For | Example |
|------|----------|---------|
| Set | Simple field ops | Add/rename fields |
| Code | Complex logic | Custom transforms |
| Item Lists | Array ops | Split/concat/sort |
| Merge | Combine streams | Join data sources |
| Aggregate | Summarize | Group and count |
| Split Out | Flatten arrays | Array to items |
| Rename Keys | Rename fields | Key mapping |

### Common Patterns

| Pattern | Input | Output |
|---------|-------|--------|
| Flatten | `{a: {b: 1}}` | `{a_b: 1}` |
| Group | `[{cat: A}, ...]` | `{A: [...]}` |
| Pivot | Rows | Columns |
| Join | Two sources | Merged |
| Aggregate | Items | Summary |

### Expression Examples

| Operation | Expression |
|-----------|------------|
| Conditional | `={{ $json.status === 'active' ? 'Yes' : 'No' }}` |
| Math | `={{ ($json.price * $json.qty).toFixed(2) }}` |
| Date format | `={{ DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') }}` |
| String concat | `={{ $json.first }} {{ $json.last }}` |
| Default value | `={{ $json.name ?? 'Unknown' }}` |

### Quick Commands

- `n8n-transform flatten --delimiter "_"` - Flatten nested objects
- `n8n-transform group --by "field"` - Group by field
- `n8n-transform join --type inner` - Join data sources
- `n8n-transform pivot --rows "a" --pivot "b"` - Pivot data
- `n8n-transform expression --type date` - Generate expressions
- `n8n-transform demo` - Run demonstration

$ARGUMENTS
