# Training

Fine-tuning adapts an existing model to your annotated histology images. HistoForge prepares the
training data from a QuPath project, runs training in your Modal workspace, and saves the trained
model in a new module. The original module is unchanged.

Before starting, complete [Setup](../getting-started/index.md) and check your
[Modal spending limit](../getting-started/modal.md#set-a-spending-limit).

To combine models or add scripts after training, use [Module authoring](../module-authoring/index.md).
You do not need to edit a recipe to train a model; HistoForge creates the result module for you.

```{toctree}
:maxdepth: 2

choose-model
prepare-data
train
review-result
publish
```
