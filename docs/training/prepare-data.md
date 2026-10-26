# Prepare training data

Training uses the HistoForge ROIs in the **whole open QuPath project**, not only the images checked
in the Project tab. Use a project containing the images and annotations you intend to train on.
First [choose a starting model and install its module](choose-model.md).

## Select the model and classes

% Revision: BASE-TRAINING

1. Open **Train**.
2. Choose the **Module**, then the **Model** you want to fine-tune.
3. For a task-specific model, check its existing class names. For a starter model, define the
   target classes and match them to the QuPath annotation classes you will use.
4. Check **Resolution (µm/px)**. It sets the pixel size used for training and for later analysis
   with the trained model. Keep the source resolution unless you intend to train at another scale.

Keep class names consistent throughout the project. Review the class selection before creating
the split; annotations outside the selected classes do not label the training task.

% Screenshot: training-classes

## Annotate the images

1. Check each image's pixel calibration in QuPath and use the first z-plane and time point
   (`z=0, t=0`).
2. Draw representative regions with the **HistoForge ROI** tool. Include the staining and tissue
   variation the model needs to handle.
3. Within each region, draw or correct the target objects and assign the selected training
   classes. Use area annotations or detections. **QuPath cell objects are not used as training
   labels.**
4. Save your work with **Save Project & Refresh**.
5. Return to **Train** and select **Refresh**. Check the reported image and ROI counts.

Use the HistoForge ROI tool, not QuPath's ordinary rectangle tool. Existing tissue-mask
annotations are not training ROIs, even if you rename them. Training rectangles must stay
inside the image and must not overlap.

If **Refresh** reports too many target objects in an ROI, replace that ROI with smaller,
non-overlapping HistoForge ROIs, review their labels, and refresh again. Existing detections
with mapped training classes count toward this limit too.

Annotate all target objects within each training ROI. Unlabeled pixels inside that ROI are
treated as background, not as unknown. An unclassified object or an object assigned to a different
class does not label the selected task. Model-generated area annotations or detections can be
used as training labels when they have the required classes. Review and, where needed, correct
them first so training does not reinforce prediction errors.

% Screenshot: training-annotations

## Separate training and validation

**Training** data is used to update the model. **Validation** data is used to measure its
performance and select a result during training. Keep related specimens together so the same
animal, patient or specimen does not appear in both sets. This prevents data leakage: closely
related tissue in both sets can make validation performance look better than performance on new
specimens.

1. Set **% validation** to the percentage you want to hold out.
2. Choose **Split by** using the table below.
3. Select **Generate split**.
4. Review the **Training** and **Validation** tables and their label counts. Drag rows between the
   tables to adjust the assignment if needed.

| Split by | What stays together |
|---|---|
| **Image** | All ROIs from one image. Use this when each image is an independent specimen. |
| **Project group** | All images with the same Group value. Use specimen identifiers to keep related slides together; treatment-group labels are not a substitute for specimen identity. |
| **ROI** | One ROI. Different ROIs from the same image may enter both sets, so this does not measure performance on independent slides. |

For **Project group**, first assign a group to every included image using
**Project → Assign Group**. A nonzero validation split needs at least two units of the chosen
type. Setting validation to 0% is allowed, but gives no held-out validation result.

% Screenshot: training-split

If you change annotations, classes or resolution, select **Refresh** and review the split again.
If it is marked **Outdated**, generate it again before starting. For an independent performance
assessment, reserve a separate test set that is not used for training or validation.

Next, [configure and start training](train.md).
