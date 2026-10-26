# Choose and install a module

A module defines what HistoForge analyzes and measures. If the terms model, recipe and module
are new to you, start with [Key concepts](../key-concepts.md).

## Choose a module

Browse the [modules library on Hugging Face](https://huggingface.co/models?other=histoforge).
It lists repositories tagged `histoforge` across researchers' and organizations' accounts.
The tag does not mean a module has been reviewed or scientifically validated by HistoForge.

Read the module's description on Hugging Face. Check its tissue, stain, species, image resolution,
output classes and measurements against your study. Its evaluation results and known limitations
should explain where it has been tested.

For the [first-analysis guide](../getting-started/first-analysis.md), use a module that includes
measurements so you can follow the workflow through to an Excel export.
Modules without measurements still produce objects for review in QuPath; they do not provide
HistoForge measurement tables or Excel export.

## Install it

1. In HistoForge, open **Modules** and select **Install module**.
2. Enter the module's repository name (`owner/name`) or its Hugging Face URL.
3. Select **Install**.
4. Read the **Trust this module?** dialog. Confirm **Install** only if you trust its source.
5. Open **Jobs** to follow the installation.

:::{warning}
Module scripts run inside QuPath and can access your files, network and open project. Install
modules only from sources you trust.
:::

% Screenshot: module-install

The module should appear in **Modules**. Select it and open **Workflow** to inspect its models,
classes and script steps; **Documentation** shows its description. If installation fails, read
the job's error before trying again.

Installing a module makes it available in your Modal workspace; it does not assign it to an image
or run an analysis. Continue to [Your first analysis](../getting-started/first-analysis.md).

## Update an installed module

Repeat the installation with the same repository name. To select an exact version, enter
`owner/name@commit`, using the full 40-character commit shown on Hugging Face. After installation,
check **Installed revision** in the module details; hovering over it shows the full commit.

An update replaces the installed copy after validation. It does not rerun analysis or change
saved objects. Use **Redo** to apply changed models or processing steps to existing results;
use **Metrics** if only the measurements changed. **Fill** may reuse the old output. See
[Actions and results](actions-and-results.md#fill-redo-and-metrics) before replacing results.
Editing a repository on Hugging Face alone does not update its installed copy.

## Create or adapt a module

To adapt a model to your annotated images, follow [Training](../training/index.md).
To combine models or add processing and measurements, follow
[Module authoring](../module-authoring/index.md). Neither is required to use an existing module.
