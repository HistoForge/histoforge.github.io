# Your first analysis

This guide takes one image through analysis, review and Excel export. Use a small representative
region for the first check. For analysis without drawing ROIs, follow [Whole-slide
analysis](../using-histoforge/whole-slide.md).

You need a saved QuPath project, a calibrated image and an installed module intended for your
tissue, stain and species. Hover over the top-right status dot and check that its tooltip says
**Connected**. See
[Install and connect](installation.md) if setup is incomplete, or
[Choose and install a module](../using-histoforge/modules.md) if none is installed.
Follow the [image-plane requirements](before-you-start.md#images-and-image-planes)
when working with a z-stack or time series.

A module without measurements still produces analysis objects. You can follow this guide through
reviewing those objects; the measurement and Excel-export steps apply only to modules that
define measurements.

## Choose an image and module

1. Open the image in QuPath.
2. In HistoForge's **Project** tab, check the box beside that image. Leave other images unchecked.
3. Select **Set Module** and choose your installed module.

Its name appears in the **Module** column. If the row says **not installed**, install that module
or choose an installed one before continuing.

% Screenshot: first-analysis-module

(draw-an-analysis-region)=
## Choose an analysis region

A **region of interest (ROI)** specifies the area to analyze. Draw a HistoForge rectangle or use
areas you have already outlined in QuPath. Choose one of the following methods.

### Draw a HistoForge ROI

1. In the **Draw ROI** controls, set the width, height and unit.
2. Select the **HistoForge ROI** tool in QuPath's toolbar.
3. Click on the tissue to place a rectangle of that size. You can also drag to draw a rectangle.
4. Select **Save Project & Refresh** in HistoForge.
5. Set **Scope** to **HistoForge ROIs**.

The first ROI on an image appears as a cyan annotation named **ROI 1**. The annotation is locked,
and the image row should report one ROI after saving. Check its position and size before running
the analysis.

HistoForge ROIs must not overlap. Each side must be between 1,024 and 6,000 full-resolution image
pixels. If the ROI is rejected or the save fails, correct the reported problem before continuing.

% Screenshot: first-analysis-roi

### Use existing annotations

1. Give the area annotations you want to analyze a dedicated QuPath class, such as
   **Analysis region**.
2. Select **Save Project & Refresh**.
3. Set **Scope** to **Annotations by class**.
4. Choose that class in **Annotation class**.

This includes all matching area annotations on the checked image, not just the highlighted one.
Their outlines must stay inside the image and must not overlap. HistoForge locks and saves the
selected boundaries before inference. See [annotation selection rules](using-existing-annotations)
for supported shapes and changing a boundary later.

% Screenshot: first-analysis-annotations

## Run the analysis

Save your edits before starting and avoid editing objects on this image while analysis runs.

1. Keep the image checked.
2. Keep the **Scope** and, if used, **Annotation class** chosen above.
3. Leave the model selector at **All models**.
4. Select **Fill** and wait for the operation to finish.

**Fill** runs missing model output. Progress appears below the image table. On a first successful
run that creates objects, **Last Run** shows **Saved**, and the classified objects appear in
QuPath.

With **All models** selected, the analysis includes the recipe's processing scripts and any
measurements. A separate **Metrics** click is not required after a successful analysis. See
[Actions and results](../using-histoforge/actions-and-results.md) before selecting individual models
or replacing existing output.

If the row reports **Failed**, **Conflict** or **Partial**, read its full message before
proceeding. These are not complete results; see
[Troubleshooting](../reference/troubleshooting.md#analysis-and-measurements).

## Review the result

Review the predictions against the tissue and the module's documented classes using your study's
review procedure. Corrections are optional. If needed, edit the objects in QuPath and save with
**Save Project & Refresh**.

% Screenshot: first-analysis-result

If the model consistently misses a relevant class or misidentifies structures, do not use its
measurements unchanged. Correct the annotations, choose a better-suited module, or consider
[fine-tuning](../training/index.md) with reviewed examples.

## Review measurements

For a module that defines measurements, the tables appear in **Project** after a successful
analysis. Check their labels and units against the module documentation.

If you changed objects, keep the image checked and select **Metrics** to recalculate the displayed
values without rerunning the models. Earlier values do not describe the edited result. Export
also recalculates measurements when needed; neither action reruns processing scripts.

% Screenshot: first-analysis-metrics

## Export to Excel

1. Keep the reviewed image checked, with the same **Scope** and annotation class used for analysis.
2. Select **Export** and save the Excel file as `metrics.xlsx`.
3. Wait for the export confirmation, then open the file in Excel or another `.xlsx` reader.

Check the image name, module, units and region coverage. See
[Export to Excel](../using-histoforge/export.md) for the workbook sheets and study groups.

Review this first result before selecting more images. Before moving to larger regions or whole
slides, check the [image preparation limits](../using-histoforge/actions-and-results.md#image-preparation-limits).
