# Create a module with an AI assistant

We recommend using an AI assistant such as ChatGPT or Claude to create custom modules.
You describe the analysis; the assistant assembles the module, writes the necessary scripts,
and saves it in a new Hugging Face repository under your account or organization.

Use an assistant with tools for editing files and uploading to Hugging Face. A text-only chat
can draft code but cannot save a repository for you. The instructions below ask it to check
its tools and access first.

You do not need to write code. You choose what to analyze and measure, approve the proposed
workflow, and review the result in QuPath.

## Start with your models

1. **Choose models you have checked on suitable images.** [Train models in HistoForge](../training/index.md)
   or reuse existing compatible models. Each HistoForge training result is already a module;
   you do not need to retrain it to combine it with others.
2. **Copy their Hugging Face repository links.** If your results are not on Hugging Face yet,
   [publish them from QuPath](../training/publish.md). They can stay private.
3. **Paste the instructions below into your AI assistant.** Add the repository links and describe
   what you want to analyze or measure. Leave anything you are unsure about blank; the instructions
   ask the assistant to help you decide.

For example: “Use my tissue-structure model first, then identify cells inside each structure.
Count the cells by class and measure each structure's area.”

The assistant needs permission to read the sources and create and write the new repository;
access configured in HistoForge does not automatically give it access. Ask it to guide secure
setup if needed; see [Hugging Face permissions](../getting-started/hugging-face.md#create-an-access-token).
Do not paste access tokens into the conversation. Share only material you have permission to
send to the AI service.

## Instructions to copy

These instructions include the technical references the assistant needs. The new repository
stays private unless you explicitly choose to make it public.

```{literalinclude} ../../_static/prompts/create-module.txt
:language: text
:class: module-creation-prompt
```

## Install and check the saved module

The assistant returns the repository link and an installation reference, `owner/name@commit`,
identifying the exact saved version. Follow [Test and share your module](test-and-share.md)
to install it and test it in a separate QuPath project. Saving the repository does not install
it in HistoForge.

Inspect the objects, compare a few measurements with values you can calculate by hand, and check
the Excel export. Ask the assistant to correct problems and save a new version, then reinstall
and repeat the affected checks. A successful upload or analysis does not establish scientific
accuracy. We recommend keeping the module private until you have checked its results, contents
and sharing terms.
