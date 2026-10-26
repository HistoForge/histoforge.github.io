# HistoForge documentation

HistoForge is an open-source project making AI for histology more accessible through QuPath.
Use the extension to analyze histology images and fine-tune deep-learning models with your own
annotations. Identify cells and tissue structures, review and correct the results in QuPath,
and export measurements to Excel.

Analysis and training run in your own [Modal](https://modal.com/) cloud workspace. You work with
the images and results in QuPath; you do not need a local GPU.

New to HistoForge? Read [Key concepts](key-concepts.md), then follow
[Setup](getting-started/index.md). If you are already connected, go to
[Using HistoForge](using-histoforge/index.md) or [Training](training/index.md).

## Where your data goes

Your QuPath project stays on your computer. HistoForge uploads image data to your Modal workspace
for analysis or training, then returns results to QuPath. Selecting a small region does not guarantee
that only its pixels are uploaded: HistoForge may upload the original slide file. Only use images
you are permitted to upload. See [Data and privacy](reference/data-and-privacy.md) for
storage and deletion details.

## Contents

```{toctree}
:maxdepth: 2

key-concepts
getting-started/index
using-histoforge/index
training/index
module-authoring/index
reference/index
contribute
```

HistoForge is not intended for clinical, diagnostic or therapeutic purposes.

To publish a module or discuss sharing a dataset, see
[Share a module or dataset](contribute.md).
