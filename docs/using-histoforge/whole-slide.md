# Whole-slide analysis

**Whole slide** runs the assigned module over an entire image. You do not need to draw HistoForge
ROIs. First check the module on a [small representative region](../getting-started/first-analysis.md)
and [set your Modal spending limit](../getting-started/modal.md#set-a-spending-limit).

For a z-stack or time series, this mode analyzes only the first z-plane and first time point
(`z=0, t=0`), not the plane currently displayed in QuPath. It does not analyze the complete stack.

The deployed backend must support the selected models at this scale, and the slide must meet
the [image preparation limits](actions-and-results.md#image-preparation-limits). Opening a slide
successfully or analyzing a small ROI does not establish that whole-slide analysis is supported.

## Run a slide

Save your edits before starting and avoid editing objects on that image while the action runs.

1. Open your saved QuPath project and the image you want to analyze.
2. In HistoForge's **Project** tab, check that image and leave other images unchecked.
3. Select **Set Module** and choose the installed module.
4. Set **Scope** to **Whole slide** and leave the model selector at **All models**.
5. Select **Fill** to run missing model output. If the same model already has ROI output on this
   image, use **Redo** and read its replacement confirmation before proceeding.

% Screenshot: whole-slide-scope

Progress appears below the image table. Processing time depends on the slide size, module and
available cloud GPUs and other compute resources. If HistoForge reports an unsupported model
or source image, follow the error; it does not silently fall back to a different analysis mode.

HistoForge checks that the image's objects have not changed since the analysis started. If you
add, delete or edit objects while it runs, the action can report **Conflict** and refuse to apply
its results, protecting your edits. Panning and zooming do not change the objects.

## Review and export

Review the results using your study's review procedure. If you make corrections in QuPath, select
**Save Project & Refresh**.

When the module defines measurements, they are calculated during the analysis. After object
edits, use **Metrics** to refresh the displayed values. With the image checked and **Scope** still
set to **Whole slide**, select **Export** to save an [Excel file](export.md); export recalculates
measurements when needed. Modules without measurements still provide objects for review.

## Change scope or resume work

Switching between ROI and whole-slide output for the same model requires **Redo**, not **Fill**.
Read the replacement confirmation: this can replace that model's results and manual corrections
to those results. See [Actions and results](actions-and-results.md).

If an action is interrupted, open **Jobs → Details** and follow
[Resume unfinished work](../reference/troubleshooting.md#resume-unfinished-work). Reopening the
project does not automatically restart the action. Images that had not started processing must
be selected again.
