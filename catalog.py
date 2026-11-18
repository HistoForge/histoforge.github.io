"""Refresh official-module metadata from HF; render saved snapshots without a network."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent
CATALOG_DIR = ROOT / "_catalog"
HF_URL = "https://huggingface.co"
OWNER = "histoforge"
# Editorial exclusions apply to both saved snapshots and future HF refreshes.
# These Epivara modules must not appear in either version of the website.
EXCLUDED_MODULE_REFS = frozenset(
    {
        "histoforge/leydig",
        "histoforge/leydig_nuclear",
        "histoforge/leydig_wholecell",
        "histoforge/lumen",
        "histoforge/spermatogenesis",
        "histoforge/tubule",
        "histoforge/tubule_semantic",
    }
)


def validate_modules(modules, *, allow_private):
    """Check the persisted fields used in the public template, including visibility."""
    if not isinstance(modules, list):
        raise ValueError("Module catalog must contain a list of modules")
    seen = set()
    for module in modules:
        ref = module["id"]
        if not isinstance(ref, str) or not re.fullmatch(
            rf"{OWNER}/[a-zA-Z0-9][a-zA-Z0-9_.-]{{0,95}}", ref
        ):
            raise ValueError("Only official HistoForge module references are allowed")
        if ref in seen:
            raise ValueError(f"Duplicate module: {ref}")
        seen.add(ref)
        if type(module["private"]) is not bool:
            raise ValueError(f"Missing or invalid visibility: {ref}")
        if module["private"] and not allow_private:
            raise ValueError("Private modules cannot be used in the public catalog")
        for field in ("name", "description"):
            if not isinstance(module[field], str) or not module[field].strip():
                raise ValueError(f"Missing {field}: {ref}")
        if not isinstance(module["tags"], list) or any(
            not isinstance(tag, str) or not tag.strip() for tag in module["tags"]
        ):
            raise ValueError(f"Invalid tags: {ref}")
        if not re.fullmatch(r"[0-9a-f]{40}", module["revision"]):
            raise ValueError(f"Invalid source revision: {ref}")
    return sorted(modules, key=lambda module: (module["name"].casefold(), module["id"]))


def load_modules(*, review=False, directory=CATALOG_DIR):
    # Private metadata is never opened by a normal build or copied as a static asset.
    path = directory / "public.json"
    if review and (directory / "private.json").exists():
        path = directory / "private.json"
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    return [
        module
        for module in validate_modules(snapshot["modules"], allow_private=review)
        if module["id"] not in EXCLUDED_MODULE_REFS
    ]


def load_landing_modules(*, review=False, directory=CATALOG_DIR):
    """List HF modules first, then unreleased plans in their editorial order."""
    modules = load_modules(review=review, directory=directory)
    listed_refs = {module["id"] for module in modules}
    plans = json.loads((directory / "planned.json").read_text(encoding="utf-8"))
    remaining_plans = [
        {**plan, "planned": True}
        for plan in plans
        if not listed_refs.intersection(plan.get("module_refs", []))
    ]
    return modules + sorted(
        remaining_plans,
        key=lambda plan: plan.get("show_last", False),
    )


def fetch_modules(*, include_private=False):
    # Optional refresh dependency: ordinary Sphinx builds only need the JSON snapshot.
    from huggingface_hub import HfApi, hf_hub_download

    # False explicitly disables saved credentials for a public refresh. True requires
    # an existing HF login for the user-authorized, local-only private preview.
    token = True if include_private else False
    api = HfApi(endpoint=HF_URL, token=token)
    modules = []
    for model in api.list_models(author=OWNER, full=True, cardData=True):
        if model.id.split("/", 1)[0] != OWNER or model.id in EXCLUDED_MODULE_REFS:
            continue
        if "recipe.json" not in {file.rfilename for file in model.siblings or []}:
            continue
        path = hf_hub_download(
            model.id, "recipe.json", revision=model.sha, token=token, endpoint=HF_URL
        )
        recipe = json.loads(Path(path).read_text(encoding="utf-8"))
        card = model.card_data.to_dict() if model.card_data else {}
        modules.append(
            {
                "id": model.id,
                "name": recipe["name"],
                "description": recipe["description"],
                "tags": card.get("tags") or [],
                "private": model.private,
                "revision": model.sha,
            }
        )
    return {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "modules": validate_modules(modules, allow_private=include_private),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--private",
        action="store_true",
        help="Include private repositories using your HF login; save for local review only",
    )
    args = parser.parse_args()
    snapshot = fetch_modules(include_private=args.private)
    CATALOG_DIR.mkdir(exist_ok=True)
    path = CATALOG_DIR / ("private.json" if args.private else "public.json")
    # Fetch and validate the whole listing before replacing a previous snapshot.
    path.write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"Saved {len(snapshot['modules'])} official modules to {path.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
