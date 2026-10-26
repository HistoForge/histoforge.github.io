"""Check the guide excerpts with the installed HistoForge backend's real parsers.

Run with the backend development Python environment and its source on PYTHONPATH.
These are recipe/header checks, not checkpoint loading or inference tests.
"""

import json
import re
from copy import deepcopy
from pathlib import Path

from histoforge.cloud.architectures.registry import require_available_model
from histoforge.cloud.modules.schema import parse_module_definition, parse_module_recipe

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples" / "module-authoring"


def model(name):
    """A parser fixture, not a published model or supplied weight file."""
    return {
        "arch": "dinov3-adapter-cellpose",
        "gpu": "L40S",
        "weights": {"type": "vendored", "file": f"{name}.safetensors"},
        "input": {"type": "field", "micronsPerPixel": 0.5},
        "output": {"type": "instance_segmentation", "classes": ["Object"]},
        "params": {"num_classes": 0, "min_instance_pixels": 0, "bsize": 256},
    }


def recipe():
    return {
        "schemaVersion": 3,
        "name": "Parser fixture",
        "models": {name: model(name) for name in ("objects", "structures")},
        "steps": [{"model": "objects"}, {"script": "metrics.groovy"}],
    }


count = (EXAMPLES / "count" / "metrics.groovy").read_text()
review = (EXAMPLES / "review_objects.groovy").read_text()
measurements = (EXAMPLES / "measurements" / "metrics.groovy").read_text()
for metric in (count, measurements):
    for include_processing in (False, True):
        value = recipe()
        scripts = {"metrics.groovy": metric}
        if include_processing:
            value["steps"].insert(1, {"script": "review_objects.groovy"})
            scripts["review_objects.groovy"] = review
        parse_module_definition(json.dumps(value), scripts)

checked = 0
paths = sorted((ROOT / "docs" / "module-authoring").glob("*.md"))
paths.append(ROOT / "docs" / "reference" / "recipe.md")
for path in paths:
    for source in re.findall(r"```json\n(.*?)```", path.read_text(), re.S):
        fragment = json.loads(source)
        value = recipe()
        if isinstance(fragment, list):
            value["steps"] = fragment
            for step in fragment:
                if "parentModel" in step:
                    value["models"][step["model"]]["input"] = {
                        "type": "crop",
                        "micronsPerPixel": 0.5,
                        "framing": {"paddingModelPx": 32},
                    }
        elif fragment.get("type") == "crop":
            value["models"]["objects"]["input"] = fragment
            value["steps"] = [
                {"model": "structures"},
                {
                    "model": "objects",
                    "parentModel": "structures",
                    "parentClass": ["Structure"],
                },
            ]
        elif "type" in fragment:
            value["models"]["objects"]["output"] = fragment
            value["models"]["objects"]["params"]["num_classes"] = len(
                fragment.get("classChannels", [])
            )
        elif "script" in fragment:
            value["steps"] = [{"model": "objects"}, fragment]
        else:
            value["steps"] = [fragment]
        normalized = parse_module_recipe(json.dumps(value))
        for settings in normalized["models"].values():
            require_available_model(deepcopy(settings))
        checked += 1
print(
    f"Validated 4 recipe/script combinations and {checked} JSON excerpts with backend parsers."
)
