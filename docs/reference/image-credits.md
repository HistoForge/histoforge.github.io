---
orphan: true
---

# Image credits

## Lizard: cells

The cell image is from the [Lizard dataset, version 1](https://www.kaggle.com/datasets/aadimator/lizard-dataset),
released by Simon Graham and colleagues under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
for research and non-commercial use. The cropped image with HistoForge's predicted
nucleus outlines and class colours retains the same licence.

The source is H&E-stained colon tissue, image `dpath_36` from DigestPath.
The displayed 885 × 885 crop starts at pixel coordinates x = 84, y = 0.
The source tissue is overlaid in QuPath with predicted nucleus boundaries and
translucent class colours. The crop is not resized, stretched or padded.

| Predicted class | Overlay colour |
|---|---|
| Epithelial | Yellow-orange (`#E69F00`) |
| Lymphocyte | Pink (`#CC79A7`) |
| Plasma | Light blue (`#56B4E9`) |
| Connective tissue | Green (`#009E73`) |
| Eosinophil | Vermilion (`#D55E00`) |

These colours mark nuclei, not whole cells. No nuclei are predicted as neutrophils
in this crop. Some nuclei are missed or misclassified, including plasma cells.

This validation crop was deliberately selected for illustration after comparing
predictions with the released annotations. It was held out from fitting model
parameters, but validation scores contributed to model selection. This is an
experimental model illustration, not independent test evidence or a claim of
diagnostic accuracy. The dataset authors did not provide or endorse these predictions.

Related paper: Graham et al., [Lizard: A Large-Scale Dataset for Colonic Nuclear
Instance Segmentation and Classification](https://openaccess.thecvf.com/content/ICCV2021W/CDPath/html/Graham_Lizard_A_Large-Scale_Dataset_for_Colonic_Nuclear_Instance_Segmentation_and_ICCVW_2021_paper.html) (2021).

## Da-Mi Kim: tissue structures

The structure image shows PAS-stained rat testis from
[Da-Mi Kim's dataset](https://doi.org/10.6084/m9.figshare.28448267), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The complete 2048 × 2048 field is retained. HistoForge adds outlines and translucent
stage colours to 11 detected tubule cross-sections.

The source field is `25_10_jpg.rf.2975e1a994d910c283fcf4edd854284c.jpg`.
It belongs to development validation material used in model selection, not an
independent test. The predictions come from HistoForge's experimental rat
seminiferous-tubule staging model, not the dataset authors' model. The authors
did not provide or endorse these predictions.

The image has no physical scale bar: its demonstration pixel size is an estimate,
not verified slide calibration.

The Metrics view is a screenshot of HistoForge's Project tab and actual measurement
table. It shows tubule area, minor and major axes, and circularity. The screenshot
is retained at its original 1714 × 1724 resolution. The physical scale in this
demonstration has not been verified, so the displayed area and length values are
illustrative, not calibrated scientific measurements.

Related paper: Kim, Rho, Wee and Son, [Automated spermatogenic staging in periodic
acid-Schiff-stained testes of Sprague–Dawley rats using a deep learning model for
normal and atrophied tissues](https://doi.org/10.1371/journal.pone.0337245) (2026).

## Da-Mi Kim: within structures

This image shows PAS-stained rat testis from Da-Mi Kim's dataset, under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The source field is `30_14_jpg.rf.4e63e8ab51c4cd6a6706e81ce6ebcac0.jpg`.
The 1536 × 1536 crop starts at x = 128, y = 256 and is not resized or padded.
It comes from development validation material, not an independent test.

| Overlay | Colour |
|---|---|
| Detected tubule outlines | Green (`#167A45`) |
| Predicted nuclei | Red (`#E53935`) |
| Predicted lumens | Amber (`#E69F00`) |

Only overlays inside the tubules are shown, without cell classifications.
The cell model ran separately on a crop around each detected tubule, including
those at the image edge. The lumen model ran on the full field shown here.
Both overlays are clipped to tubule outlines for display.
The image was exported from QuPath with filled nucleus masks and outlines.
For this illustration, lumen overlays are hidden in the central tubule and the
tubule cut off at the top-center. The main lumen overlay in the top-right corner
tubule is retained, but a small fragment beside it is hidden. The saved model
predictions are unchanged.

These are unreleased research models trained on H&E tissue. This PAS example
illustrates the workflow, not independently measured accuracy. It does not imply
that the models are available to download. There is no physical scale bar because
the demonstration pixel size has not been verified.

## RINGS: tissue regions

The landing page shows prostate tissue from the [RINGS algorithm dataset, version 1](https://doi.org/10.17632/h8bdwrtnr5.1),
by Massimo Salvi, Martino Bosco, Luca Molinaro, Alessandro Gambella, Mauro Giulio Papotti,
Udyavara Rajendra Acharya and Filippo Molinari (2021), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The colours show model predictions: blue for gland-only regions, pink for tumour-only
regions, and orange where gland and tumour predictions overlap. Uncoloured tissue retains
its original appearance. These are region masks, not outlines of individual glands.

Image `P4_C10_16_9_7` comes from the dataset's training material and was assigned to our
development validation split. It illustrates model output, not independent performance
or a clinical assessment. The dataset authors did not provide or endorse these predictions.

Changes to the source image: resized and overlaid with model predictions.
The full tissue field is retained. The landing image was extracted from
the prediction panel of the original–annotation–prediction comparison without changing
its colours or masks.

Related paper: Salvi et al., [A hybrid deep learning approach for gland segmentation in
prostate histopathological images](https://doi.org/10.1016/j.artmed.2021.102076) (2021).

## Whole slide inference

The slide is `CMU-1.svs` from the
[OpenSlide Aperio collection](https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/),
released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/),
as [listed by QuPath](https://qupath.readthedocs.io/en/stable/docs/intro/acknowledgements.html).

Four tissue regions were drawn by hand in QuPath. One is highlighted in yellow;
this is selection, not model output. HistoForge's **Annotations by class** scope
includes all four **Tissue region** annotations, regardless of which is highlighted.
This view shows the controls before a module is assigned or analysis is run.

The two actual windows were cropped from one screenshot and arranged side by side.
The desktop background was removed; window pixels and proportions are unchanged.

## Module library

The Modules-tab image shows installed modules and documentation for the selected
DeepLIIF Ki-67 module. It is an interface example, not a model-performance result
or evidence of a completed publication workflow.

## Training interface

The Training view shows DeepLIIF selected and the controls for choosing training
and validation data. No training regions or data split have been prepared in
this capture; it does not show a training run or results.
