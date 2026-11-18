# Test and share your module

Test in a separate QuPath project before using a changed module on study images. A successful
installation checks the package; a successful analysis shows that it runs. Neither establishes
the model's scientific accuracy.

## Test an update

1. Save the changed files in your Hugging Face repository and note the commit. A commit identifies
   that saved version of the files.
2. In **Modules → Install module**, enter `owner/name@commit`, replacing `commit` with the full
   40-character commit shown on Hugging Face. Reinstalling the same repository replaces its
   installed version after validation; there is no separate **Replace** action.
3. Select the module and check **Installed revision**. Hover over it to see the full commit.
4. Check **Workflow** and **View recipe.json** against your changes before running them.

If the model, its settings, or the processing recipe changed, run **Redo** with **All models** on
your test regions. **Fill** may reuse existing model output. Redo replaces those models' previous
output, including manual corrections to it, so do this in the test project.

If only `metrics.groovy` changed, use **Metrics**. It recalculates from current objects without
rerunning models or processing scripts.

Keep the prior working commit so you can reinstall it if needed. Installing a different version
does not undo changes already saved in a QuPath project.

## Check expected behavior

| Test | What to check |
|---|---|
| Small representative region | Correct class labels, plausible outlines, and measurements you can check independently. |
| No matching objects | Zero counts and empty distributions, not invented values or errors. |
| Model within structures | Accepted structures provide child inputs. With **Redo**, no accepted structures means no child analysis; also check the [Fill behavior](recipes.md#run-a-model-within-detected-structures). |
| Processing script run twice | Class changes remain consistent; objects do not accumulate repeated changes. |
| Measurements and export | Units, individual values and grouped summaries agree with a hand-calculated example. |
| Invalid file or script | A clear failure, not a plausible-looking replacement result. Use only your test copy. |

Test class filters on a fresh image without previous results. A measurement can otherwise count
eligible objects from another module that share the same class.

For scientific evaluation, use images independent of training and model selection. Describe the
images, annotations, evaluation procedure and limitations; do not substitute a successful software
test for that evidence.

## Explain what you are sharing

The repository's `README.md` is its model card. Include:

- **Purpose and inputs:** task, tissue, stain, species, image resolution and supported use.
- **Outputs:** classes, processing steps and measurements with units.
- **Evidence and limitations:** training sources, evaluation images and methods, results, and
  known failure cases. Explain how example images were selected.
- **Sources and permissions:** original models, datasets and scripts, citations, applicable
  terms, and required license files or notices.
- **Use and changes:** installation instructions, the version tested, and what changed from the
  source or previous version.

Keep a copied model's history, but revise claims that no longer describe your result. In
particular, the source model's evaluation does not validate a new fine-tuned model.
See [Hugging Face's model-card guide](https://huggingface.co/docs/hub/model-cards) for formatting.

## Share the tested version

If you or your AI assistant saved the module directly on Hugging Face, you do not need to
publish it again from QuPath. After testing and reviewing its contents and sharing terms,
change the repository's visibility on Hugging Face if you want to make it public. Do not
publish an older installed copy over your newer edits.

To upload a module installed in QuPath, follow [Publish a module](../training/publish.md).
That guide also explains visibility, license notices and the `histoforge` discovery tag.
You can publish under your own account or lab organization; contacting HistoForge is not
a prerequisite.

Finally, verify that the intended audience can open the repository and install the tested
revision. To discuss contributing a dataset or model, email
[histoforge.contact@gmail.com](mailto:histoforge.contact@gmail.com).
