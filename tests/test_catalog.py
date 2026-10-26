"""Offline catalog checks: official ownership, private isolation, HF import and HTML."""

from copy import deepcopy
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from jinja2 import Environment, FileSystemLoader

from catalog import (
    EXCLUDED_MODULE_REFS,
    HF_URL,
    ROOT,
    fetch_modules,
    load_landing_modules,
    load_modules,
    main,
    validate_modules,
)


def module(**changes):
    return {
        "id": "histoforge/example",
        "name": "Example module",
        "description": "Example description.",
        "tags": ["histoforge", "testis", "h-and-e"],
        "private": False,
        "revision": "a" * 40,
        **changes,
    }


class CatalogTest(unittest.TestCase):
    def test_only_official_unique_references_are_accepted(self):
        for ref in (
            "community/example",
            "histoforge-other/example",
            "histoforge/../example",
        ):
            with self.subTest(ref=ref), self.assertRaises(ValueError):
                validate_modules([module(id=ref)], allow_private=True)
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            validate_modules([module(), module()], allow_private=True)

    def test_public_catalog_rejects_private_or_unspecified_visibility(self):
        for visibility in (True, None, "false", 0):
            with self.subTest(visibility=visibility), self.assertRaises(ValueError):
                validate_modules([module(private=visibility)], allow_private=False)

    def test_name_description_tags_and_revision_are_checked(self):
        for changes in (
            {"name": ""},
            {"description": None},
            {"tags": "testis"},
            {"tags": [42]},
            {"revision": "main"},
        ):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_modules([module(**changes)], allow_private=True)

    def test_order_is_alphabetical_without_changing_names_or_source_tags(self):
        entries = [module(name="Zed"), module(id="histoforge/second", name="Alpha")]
        original = deepcopy(entries)
        result = validate_modules(entries, allow_private=False)
        self.assertEqual([entry["name"] for entry in result], ["Alpha", "Zed"])
        self.assertEqual(entries, original)

    def test_private_snapshot_is_only_read_for_review(self):
        with TemporaryDirectory() as temp:
            directory = Path(temp)
            public = module()
            private = module(id="histoforge/private-example", private=True)
            (directory / "public.json").write_text(json.dumps({"modules": [public]}))
            (directory / "private.json").write_text(json.dumps({"modules": [private]}))
            self.assertEqual(load_modules(directory=directory), [public])
            self.assertEqual(load_modules(review=True, directory=directory), [private])
            (directory / "private.json").write_text("not valid JSON")
            self.assertEqual(load_modules(directory=directory), [public])

    def test_review_uses_public_snapshot_when_no_private_snapshot_exists(self):
        with TemporaryDirectory() as temp:
            directory = Path(temp)
            (directory / "public.json").write_text(json.dumps({"modules": [module()]}))
            self.assertEqual(load_modules(review=True, directory=directory), [module()])

    def test_epivara_modules_are_excluded_from_saved_public_and_review_snapshots(self):
        for review in (False, True):
            with self.subTest(review=review), TemporaryDirectory() as temp:
                directory = Path(temp)
                retained = module(
                    id="histoforge/rat-seminiferous-tubule-staging", private=review
                )
                excluded = [
                    module(id=f"histoforge/{name}", private=review)
                    for name in (
                        "leydig",
                        "leydig_nuclear",
                        "leydig_wholecell",
                        "lumen",
                        "spermatogenesis",
                        "tubule",
                        "tubule_semantic",
                    )
                ]
                path = directory / ("private.json" if review else "public.json")
                path.write_text(json.dumps({"modules": [*excluded, retained]}))
                entries = load_modules(review=review, directory=directory)
                self.assertEqual(entries, [retained])
                html = self.render(entries, review=review)
                self.assertIn(retained["id"], html)
                for ref in EXCLUDED_MODULE_REFS:
                    self.assertNotIn(f'href="{HF_URL}/{ref}"', html)

    def test_private_data_in_public_snapshot_fails_instead_of_being_published(self):
        with TemporaryDirectory() as temp:
            directory = Path(temp)
            (directory / "public.json").write_text(
                json.dumps({"modules": [module(private=True)]})
            )
            with self.assertRaisesRegex(ValueError, "Private modules"):
                load_modules(directory=directory)

    def test_plans_are_replaced_only_by_matching_listed_modules(self):
        with TemporaryDirectory() as temp:
            directory = Path(temp)
            tissue = module(id="histoforge/ignite-nsclc-he-tissue", private=True)
            plans = [
                {
                    "name": "Lung cancer tissue regions",
                    "description": "Tissue segmentation.",
                    "datasets": ["IGNITE"],
                    "module_refs": [tissue["id"]],
                },
                {
                    "name": "PD-L1 scoring",
                    "description": "Tissue and cell scoring.",
                    "datasets": ["IGNITE"],
                },
            ]
            (directory / "public.json").write_text(json.dumps({"modules": []}))
            (directory / "private.json").write_text(json.dumps({"modules": [tissue]}))
            (directory / "planned.json").write_text(json.dumps(plans))
            public = load_landing_modules(directory=directory)
            review = load_landing_modules(review=True, directory=directory)
            self.assertEqual(public, [{**plan, "planned": True} for plan in plans])
            self.assertEqual(review, [tissue, {**plans[1], "planned": True}])
            self.assertNotIn(tissue["id"], self.render(public))
            self.assertIn(tissue["id"], self.render(review, review=True))
            (directory / "private.json").write_text("not valid JSON")
            self.assertEqual(load_landing_modules(directory=directory), public)

    def test_failed_refresh_preserves_previous_snapshot(self):
        with TemporaryDirectory() as temp:
            path = Path(temp) / "public.json"
            previous = json.dumps({"modules": [module()]})
            path.write_text(previous)
            with (
                patch("catalog.CATALOG_DIR", Path(temp)),
                patch("sys.argv", ["catalog.py"]),
                patch(
                    "catalog.fetch_modules", side_effect=RuntimeError("HF unavailable")
                ),
            ):
                with self.assertRaisesRegex(RuntimeError, "HF unavailable"):
                    main()
            self.assertEqual(path.read_text(), previous)

    def test_listed_modules_precede_plans_while_preserving_plan_order(self):
        with TemporaryDirectory() as temp:
            directory = Path(temp)
            nuclei = module(id="histoforge/nuclei", name="A nuclei", private=True)
            tissue = module(id="histoforge/tissue", name="B tissue", private=True)
            plans = [
                {"name": "Nuclei", "show_last": True, "module_refs": [nuclei["id"]]},
                {"name": "Another nuclei", "show_last": True},
                {"name": "Glands"},
            ]
            (directory / "public.json").write_text(json.dumps({"modules": []}))
            (directory / "private.json").write_text(
                json.dumps({"modules": [nuclei, tissue]})
            )
            (directory / "planned.json").write_text(json.dumps(plans))
            public = load_landing_modules(directory=directory)
            review = load_landing_modules(review=True, directory=directory)
            self.assertEqual(
                [entry["name"] for entry in public],
                ["Glands", "Nuclei", "Another nuclei"],
            )
            self.assertEqual(
                [entry["name"] for entry in review],
                ["A nuclei", "B tissue", "Glands", "Another nuclei"],
            )

    def test_refresh_uses_hf_tags_and_recipe_at_the_listed_commit(self):
        for private in (False, True):
            with self.subTest(private=private), TemporaryDirectory() as temp:
                recipe_path = Path(temp) / "recipe.json"
                recipe_path.write_text(
                    json.dumps(
                        {
                            "name": "Name from HF recipe",
                            "description": "Description from HF recipe.",
                        }
                    )
                )
                model = SimpleNamespace(
                    id="histoforge/example",
                    private=private,
                    sha="b" * 40,
                    siblings=[SimpleNamespace(rfilename="recipe.json")],
                    card_data=SimpleNamespace(
                        to_dict=lambda: {"tags": ["histoforge", "pas"]}
                    ),
                )
                api = Mock()
                api.list_models.return_value = [
                    SimpleNamespace(id="someone/example"),
                    SimpleNamespace(id="histoforge/not-a-module", siblings=[]),
                    *(SimpleNamespace(id=ref) for ref in EXCLUDED_MODULE_REFS),
                    model,
                ]
                sdk = SimpleNamespace(
                    HfApi=Mock(return_value=api),
                    hf_hub_download=Mock(return_value=recipe_path),
                )
                with patch.dict("sys.modules", {"huggingface_hub": sdk}):
                    snapshot = fetch_modules(include_private=private)
                sdk.HfApi.assert_called_once_with(endpoint=HF_URL, token=private)
                api.list_models.assert_called_once_with(
                    author="histoforge", full=True, cardData=True
                )
                sdk.hf_hub_download.assert_called_once_with(
                    "histoforge/example",
                    "recipe.json",
                    revision="b" * 40,
                    token=private,
                    endpoint=HF_URL,
                )
                self.assertEqual(
                    snapshot["modules"],
                    [
                        module(
                            name="Name from HF recipe",
                            description="Description from HF recipe.",
                            tags=["histoforge", "pas"],
                            private=private,
                            revision="b" * 40,
                        )
                    ],
                )
                self.assertIn("fetched_at", snapshot)

    def render(self, entries, *, review=False):
        template = Environment(
            loader=FileSystemLoader(ROOT / "_templates")
        ).get_template("landing.html")
        return template.render(
            landing_modules=entries,
            review_enabled=review,
            landing_download_url="",
            pathto=lambda path, *args: path,
        )

    def test_cards_render_real_links_and_escape_all_hf_copy(self):
        html = self.render(
            [
                module(
                    name="Name <img src=x>",
                    description="Cells & tissue.",
                    tags=["histoforge", "<script>alert(1)</script>"],
                )
            ]
        )
        self.assertIn('href="https://huggingface.co/histoforge/example"', html)
        self.assertIn("Name &lt;img src=x&gt;", html)
        self.assertIn("Cells &amp; tissue.", html)
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", html)
        self.assertNotIn("<li>histoforge</li>", html)
        self.assertNotIn("includes private repositories", html)
        self.assertLess(
            html.index('class="workflow"'), html.index('id="selected-modules"')
        )
        self.assertLess(
            html.index('class="introduction-copy"'), html.index('class="contact"')
        )

    def test_empty_catalog_omits_section_and_review_has_no_development_notice(self):
        self.assertNotIn('id="selected-modules"', self.render([]))
        self.assertNotIn('id="selected-modules"', self.render([], review=True))
        html = self.render([module(private=True)], review=True)
        self.assertIn("Selected modules</h2>", html)
        self.assertNotIn("Official modules", html)
        self.assertNotIn("Local preview", html)
        self.assertNotIn("includes private repositories", html)

    def test_pagination_controls_are_conditional_and_all_cards_start_visible(self):
        for count, pages in ((0, 0), (1, 1), (6, 1), (7, 2), (12, 2), (13, 3)):
            with self.subTest(count=count):
                html = self.render(
                    [module(id=f"histoforge/example-{i}") for i in range(count)]
                )
                self.assertEqual(html.count('class="module-card"'), count)
                self.assertEqual(html.count('class="module-page"'), pages)
                self.assertNotIn('class="module-card" hidden', html)
                self.assertNotIn('class="module-page" hidden', html)
                if count:
                    self.assertIn('--module-rows: 3; --module-rows-narrow: 6;', html)
                if pages > 1:
                    self.assertIn('data-page-size="6"', html)
                    self.assertIn('aria-label="Selected modules pages" hidden', html)
                    self.assertEqual(html.count("data-module-page="), pages)
                    self.assertIn('aria-controls="module-list"', html)
                else:
                    self.assertNotIn('class="module-pagination"', html)

    def test_no_empty_tag_list_when_only_redundant_tag_is_present(self):
        self.assertNotIn(
            'class="module-tags"', self.render([module(tags=["histoforge"])])
        )

    def test_planned_cards_are_readable_without_fake_links_or_hf_tags(self):
        html = self.render(
            [{
                "name": "Planned <name>",
                "description": "Cells & tissue.",
                "datasets": ["Source <dataset>"],
                "module_refs": ["histoforge/private-example"],
                "planned": True,
            }]
        )
        self.assertIn('class="module-card module-card-planned" tabindex="-1"', html)
        self.assertIn("Planned &lt;name&gt;", html)
        self.assertIn("Cells &amp; tissue.", html)
        self.assertIn("Source &lt;dataset&gt;", html)
        self.assertIn('aria-label="Proposed source datasets"', html)
        self.assertIn('class="module-status"', html)
        self.assertIn('aria-label="Not yet available"', html)
        self.assertNotIn("</svg>Planned", html)
        self.assertNotIn('aria-label="Hugging Face tags"', html)
        self.assertNotIn("histoforge/private-example", html)


if __name__ == "__main__":
    unittest.main()
