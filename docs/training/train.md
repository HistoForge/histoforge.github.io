# Start training

Begin with a prepared [training project and reviewed split](prepare-data.md).

## Choose the result

Enter a descriptive **Name** for the result module. When **Type** offers a choice, select:

| Result | What it contains |
|---|---|
| **Copy module and replace this model** | A new copy of the source workflow with the selected model fine-tuned. The other models and scripts are retained. |
| **Create a standalone module with this model** | A new module containing only the selected model, without the source workflow's other steps or measurement scripts. |

Models that run within detected structures remain in a copied workflow with their preceding model.
Neither choice overwrites the original module. **Inference GPU** sets the trained model's default
GPU for later analysis; **Training GPU** controls this training run.

## Review the training settings

The form starts with defaults for the selected model. Review these before starting:

| Setting | Meaning |
|---|---|
| **Training GPU** | The cloud GPU used for this run. |
| **Training batch size** | The number of image views processed together. Larger batches use more GPU memory. |
| **Epochs** | The number of training cycles. More epochs take more time and compute. |
| **Augmentations** | Transformations applied to training images, selected from the offered checkboxes. |
| **Minimum object area** | For individual-object models, removes predicted objects smaller than this area during validation and later analysis. Uses square pixels at the model's resolution; training annotations are unchanged. |

Image-view size controls and additional settings depend on the model. Leave their defaults for
the first run unless you have a specific experimental reason to change them. Nearby tissue added
as context around a small ROI is input only; it does not become labeled training area.

% Screenshot: training-settings

## Start and monitor the run

1. Confirm the result name, split and settings, and check your
   [Modal spending limit](../getting-started/modal.md#set-a-spending-limit).
2. Select **Start cloud training**.
3. Keep QuPath open while HistoForge prepares and uploads the data.
4. Once the run appears in **Jobs**, use **Open latest details** to inspect progress and metrics.

To request cancellation, use **Cancel** in **Jobs** when it is offered. Wait for **Cancelled**
before treating the run as stopped; closing QuPath does not cancel it. If submission reports an
unconfirmed response, check **Jobs** before starting another run; the first request may already
have been accepted.

% Screenshot: training-job

Wait for **Complete**, then [review the trained result](review-result.md). A failed or cancelled
run is not a completed model.

**Export dataset...** is optional. It saves the training data and split locally on your computer
for use outside the cloud workflow; it does not start training.
