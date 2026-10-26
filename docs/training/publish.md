# Publish a module

Publishing copies an installed module from your cloud account to Hugging Face. Keep the repository
private for your own work, or make it public so others can install it. You can use a trained module
without publishing it.

## Before publishing

Your [Hugging Face token](../getting-started/hugging-face.md#create-an-access-token) needs read and
write access to the destination. If the repository does not exist, your account must also be
allowed to create it under the chosen owner or organization.

## Review permissions and license notices

% Revision: PUBLISH-LICENSE

As the publisher, check permission to share the included weights, scripts and supporting files.
Review the source model and any pretrained weights as well as the code. Keep required attribution,
license texts and notices with the module; fine-tuning does not remove upstream terms.

HistoForge does not choose a license or check compatibility for you. There is no license selector
in the publish dialog. Maintain the applicable terms in the repository and its README metadata;
see [Hugging Face's license guidance](https://huggingface.co/docs/hub/repositories-licenses).

## Publish from QuPath

1. In **Modules**, select the module and choose **⋯ → Publish…**.
2. Enter **Target repo** as `owner/name`.
3. Choose **Private** or **Public** under **New repo visibility**. Private is the default.
4. Select **Publish** and follow the job in **Jobs**.
5. When it succeeds, open the target repository on Hugging Face and check its files and README.

Use a new private repository when making a copy for editing. **New repo visibility** applies only
when creating a repository; it does not make an existing public repository private. Change an
existing repository's visibility on Hugging Face.

Publication can replace model and script files in an existing destination. Check **Target repo**
carefully before submitting.

% Screenshot: publish-module

Publishing includes the recipe, weights, scripts, training report when present, and retained
supporting files such as the README and license notices. It does not separately collect training
images or the QuPath project. If you included images or other sensitive files in the module
repository, they are supporting files too: inspect the complete file list before making it public.

## Check the published information

% Revision: PUBLISH-LICENSE

An existing README or license file at the destination is preserved. A file from the source fills
a missing destination path. HistoForge creates a basic README only for a new module without one;
it does not assign a default license.

Review the destination's description, terms and notices after publishing, especially when updating
an existing repository. New weights do not automatically update the model card's scientific claims.
A copied README may describe the source model rather than your fine-tuned result.

Describe the intended images, classes, measurements, evaluation and limitations. Inspect the
training report too: it contains class names, settings and evaluation details. For a concise
content checklist, see [Explain what you are sharing](../module-authoring/test-and-share.md#explain-what-you-are-sharing).

## Help others find your module

Publish under your own Hugging Face account or lab organization; you do not need to join the
HistoForge organization. To appear in the public
[modules library](https://huggingface.co/models?other=histoforge), make the repository public
and include `histoforge` in the README's `tags` metadata.

HistoForge adds this tag to newly generated READMEs. For an existing README, check that the tag
is present; publishing does not update its metadata. Keep the tag when editing the README, and
add relevant tissue, stain and task tags to help researchers find it. Tags do not change a
repository's visibility: private modules remain accessible only to people with permission.

To discuss contributing a dataset or model, see
[Share a module or dataset](../contribute.md).

## Use the published copy

Publishing alone does not change the installed module. Install the published `owner/name` through
the normal [module installation](../using-histoforge/modules.md#install-it) workflow when you want
to use that published identity.

For modules not produced by a training run, the publish dialog also offers
**Also install the published copy locally**. Here, “locally” means the installed modules in your
Modal workspace, not model files on your laptop. This updates the installed copy of the destination
repository, including when it is the same repository as the source. A private training result
remains unchanged.

If publication succeeds but that optional installation fails, the repository can still contain
the published version. Check the job details and install that revision separately; do not assume
the publication was undone.
