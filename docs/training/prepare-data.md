# Prepare training data

Training uses the HistoForge ROIs in the **whole open QuPath project**, not only the images checked
in the Project tab. Use a project containing the images and annotations you intend to train on.
First [choose a starting model and install its module](choose-model.md).

## Annotate the images

1. Check each image's pixel calibration in QuPath and use the first z-plane and time point
   (`z=0, t=0`).
2. Draw representative regions with the **HistoForge ROI** tool. Include the staining and tissue
   variation the model needs to handle.
3. Within each region, label all target objects with consistent QuPath class names. Use area
   annotations or detections. HistoForge does not use QuPath cell objects as training labels.
   You can use model-generated annotations or detections after checking and correcting them.
4. Save your work with **Save Project & Refresh**.

Use the HistoForge ROI tool, not QuPath's ordinary rectangle tool. Existing tissue-mask
annotations are not training ROIs, even if you rename them. Training rectangles must stay
inside the image and must not overlap.

% Screenshot: training-annotations

## Select the model and classes

% Revision: BASE-TRAINING
% Revision: TRAINING-CLASSES

Open **Train**. HistoForge reads your project annotations while you choose the **Module** and
**Model** to fine-tune. Under **Training classes**, the choices depend on what the starting
model predicts. Click the information button beside a choice to keep its explanation open.

| Starting model | What to choose |
| --- | --- |
| Outlines objects with one label | Choose **Outline objects only** to give every object the same label. Choose **Outline and classify objects** to teach the model to distinguish types. |
| Predicts named classes | Choose **Keep the model's classes** to build on the classes it already recognizes. You can add classes when offered. Choose **Replace the model's classes** to teach a new set from your annotations, even if some names stay the same. |

1. Under **Train as**, check what each **QuPath annotation class** will teach. To use an
   annotation name as a new model class, choose **New model class** when offered. If the form
   offers **Add model class…** below the list, you can enter a class name there.
2. Check **Model predicts** for the labels the trained model will return. Within a training
   ROI, unannotated tissue and objects assigned to **Background** teach the model background.
3. Under **Parameters**, check **Resolution (µm/px)**. Keep the model's resolution unless you
   intend to change the scale for both training and later analysis.

:::{figure} /_static/images/screenshots/training-classes.png
:alt: The Train as menu for each of six QuPath nucleus classes is set to the corresponding class in the Lizard model.
:figclass: screenshot
:name: training-classes
:width: 882px

Here, nuclei annotated as *epithelial* in QuPath teach the model's *Epithelial* class.
:::

If HistoForge reports too many target objects in an ROI, replace that ROI with smaller,
non-overlapping HistoForge ROIs, review their labels, and refresh again. Existing detections
with mapped training classes count toward this limit too.

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

To generate a split, assign at least one annotated object inside a training ROI to a model
class. To start training or export the dataset, at least one such object must be in **Training**.
**Training** must also include an example of each class the model will learn from scratch.
If a new class appears only in **Validation**, label an example in a training specimen or
move that whole validation specimen to **Training**.

% Screenshot: training-split

Changing **Train as** updates the counts without moving rows between **Training** and
**Validation**. If you edit annotations, ROIs or image groups in QuPath, select **Refresh**
to read those changes. It keeps your assignments when the same rows and split settings remain.
If you change **Split by** or **% validation**, or the split still says **Outdated** after
refreshing, select **Generate split** and review the new assignments.

For an independent performance assessment, reserve a separate test set that is not used for
training or validation.

Next, [configure and start training](train.md).
