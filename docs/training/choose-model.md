# Choose a starting model

Use a task-specific model when its task and classes fit your study. A **starter model** instead
supplies initial weights for learning a new task from your annotations. Install the module
containing your chosen model, then select it in **Train**. You do not need to edit its recipe.

% Revision: BASE-TRAINING

## Choose by the objects you need

Each method has two starting-weight options, explained below. The links open the starter
modules' model cards on Hugging Face.

| Method | Start here for | H&E-12 weights | DINOv3 weights |
| --- | --- | --- | --- |
| **Cellpose** | Nuclei, cells and irregular or elongated objects | [H&E-12 Cellpose](https://huggingface.co/histoforge/starter-he12-cellpose) | [DINOv3 Cellpose](https://huggingface.co/histoforge/starter-dinov3-cellpose) |
| **HoVer** | Large individual tissue structures | [H&E-12 HoVer](https://huggingface.co/histoforge/starter-he12-hovernet) | [DINOv3 HoVer](https://huggingface.co/histoforge/starter-dinov3-hovernet) |
| **Dense semantic** | Tissue compartments, rather than separate cells | [H&E-12 Semantic](https://huggingface.co/histoforge/starter-he12-semantic) | [DINOv3 Semantic](https://huggingface.co/histoforge/starter-dinov3-semantic) |

Both Cellpose and HoVer can separate touching objects and segment nuclei. These are starting
recommendations, not a guarantee that one will be more accurate or faster on your images.
Compare the trained result on held-out images, including crowded areas and unusual shapes.

Cellpose groups pixels into objects by following predicted flows. HoVer uses watershed
separation, without repeated flow-following steps. Cellpose can also segment large structures,
but objects spanning many pixels may need more flow-following iterations to form complete
objects. These are steps during prediction, not
training epochs. HistoForge fixes this iteration count internally; increasing training epochs
does not change it. Object size here means its size in pixels at the chosen resolution, not the
overall slide size.

## Choose the starting weights

Each method has two starting-weight families:

| Family | Starting point |
|---|---|
| **H&E-12** | Histology-pretrained weights. The Cellpose starter retains its pretrained segmentation model; the HoVer and semantic variants have newly initialized prediction layers. |
| **DINOv3** | A pretrained image encoder, with newly initialized layers for histology segmentation. |

Starter labels such as `Object` and `Foreground` are generic, not learned biological classes.
Define your target classes and resolution during training. Newly initialized prediction layers
need training before their results are meaningful; pretrained components do not establish
accuracy on your images. Review the starter's model card for its initialization and terms.

The **Train** tab lists only installed modules containing a model supported for training by the
connected backend. Within a module, only supported models can be selected. A model can be
available for analysis without having a supported training implementation.

[Install your chosen module](../using-histoforge/modules.md#install-it), then
[prepare your training data](prepare-data.md).
