# Troubleshooting

Start with the message shown in HistoForge. For a failed image, inspect **Last Run** for the
complete message before repeating the action.

## Connection

| Message | What to do |
|---|---|
| **Cloud backend not configured** | Select **Set up cloud** and follow [Connect the backend](../getting-started/installation.md#connect-the-backend). |
| **Not connected** | On the setup screen, [save your Hugging Face token](../getting-started/installation.md#connect-the-backend), then select **Set up backend**. |
| **Backend not reachable** | Select **Retry**. If it persists, check the Modal app in your configured workspace. |
| **Gateway credential rejected** | Finish other sessions' cloud work before selecting **Reconnect**. Do not edit `deployment.json` manually. |
| **Backend version incompatible** | Check that the extension and deployed backend are from a compatible release. Retrying alone will not resolve a version mismatch. |
| **Connection changed: restart QuPath** | Save the project and restart QuPath to use the new connection. |

% Revision: HF-SETUP

If token verification fails during setup, check that the token was copied correctly and has the
[required permissions](../getting-started/hugging-face.md#create-an-access-token). Confirm the
intended Modal account and workspace before trying again; QuPath has no workspace-selection
dialog. The setup screen's **Recheck** button checks connection status, not token validity.

**Reconnect** replaces the backend's connection key. This can disconnect another QuPath session
using the same backend. Use **Retry** or **Recheck** to check status without replacing the key.

**Update cloud backend** in **Settings** is not a version check. After confirmation, it stops
unfinished cloud work and redeploys the backend bundled with the extension. Saved results are
kept. Do not submit work or reconnect from another session until the update finishes. To check
the backend version without updating, use **Recheck** in **Settings**.

For AWS sign-in, missing S3 slides or repeated session-expiry messages, use
[Cloud-slide troubleshooting](../using-histoforge/cloud-images.md#troubleshooting). The AWS slide
connection is separate from the backend connection above.

(stopping-the-backend)=
### Stopping the backend

Modal's **Stop app** stops running work and scheduled cleanup. It is not a pause-and-resume
feature: the backend must be deployed again before it can be used. See
[Modal's explanation](https://modal.com/docs/guide/managing-deployments#stopping-deployments).
Do not use it to pause an analysis or training run.

Reopening QuPath or selecting **Retry** or **Recheck** does not redeploy the backend. **Reconnect**
requires an existing deployment; it does not redeploy it. Redeployment must use HistoForge's
deployment helper, not a direct `modal deploy` command. Do not delete or edit `deployment.json`
to force setup.

Stopping the app does not delete its stored modules or training datasets, so
[storage charges](../getting-started/modal.md#storage-costs) may continue. Analysis uploads can
[expire while the app is stopped](data-and-privacy.md#uploaded-analysis-images); retaining files
does not guarantee that interrupted work can resume.

## Modules and images

| Problem | What to do |
|---|---|
| No modules are installed | Follow [Install a module](../using-histoforge/modules.md#install-it) through **Modules → Install module**. |
| A module is marked **not installed** | Install that exact module reference or use **Set Module** to choose an installed module. |
| Hugging Face rejects a download or publication | Check [token permissions](../getting-started/hugging-face.md#create-an-access-token) and access to the repository. Downloads need read access; publication also needs write access and, for a new repository, permission to create it. |
| No analysis regions match the selection | Check **Scope**. For **HistoForge ROIs**, draw and save a HistoForge rectangle. For **Annotations by class**, check the exact class and select **Save Project & Refresh**. Highlighting an annotation is not enough. |
| Annotation boundaries are rejected | Use area annotations inside the image without overlapping areas. Points, lines, detections and HistoForge-generated results cannot be selected as boundaries. |
| A required slide file is missing | Keep the main slide and its companion files together, with their original names and folder structure. See [Open a local image](../getting-started/before-you-start.md#open-a-local-image). |
| Calibration fails | Check the pixel width and height in QuPath and the module's resolution requirements. Do not substitute an assumed calibration. |
| An ROI is on an unsupported image plane | Analysis and training ROIs must be on the first z-plane and first time point (`z=0, t=0`). HistoForge does not move them to another plane automatically. |
| **Metrics** or **Export** is disabled | Check at least one image and confirm that every checked image has an installed module that defines measurements. Wait for any running action to finish. |

## Analysis and measurements

**Failed**
: The action did not complete. Read the full error and correct its cause before rerunning.

**Partial**
: Some work succeeded and some failed. Check **Jobs → Details** to see which results were saved
  and whether measurements finished. Inspect the image before treating it as fully analyzed.

**Conflict**
: The image or project changed while the action was running. Review and save the current state,
  select **Save Project & Refresh**, then start the action again.

**Metrics need recomputation**
: Objects changed after the previous calculation. Review the edits and select **Metrics**.

**Output present**
: Output from the assigned module exists in the selected scope. This is a presence indicator,
  not a quality score or proof that every model step completed.

(prepared-image-exceeds-the-size-limit)=
### Image-size limits

Read which limit the message names: a prepared image file, a model's input dimensions, or missing
support for large-region analysis. These are different from AWS sign-in and GPU-memory errors.
Previously saved results are kept when image preparation fails.

Use a smaller region with a smaller **bounding rectangle**. The estimate counts all RGB pixels
in that rectangle plus encoding overhead, not just pixels inside a polygon. Removing parts of
a polygon without reducing its bounding rectangle may not help; retrying the unchanged region
does not resolve the limit.

For a model-input limit, reduce the region rather than editing the model's resolution or tiling
settings to force it through. Changing those settings can change its predictions. See
[Image preparation limits](../using-histoforge/actions-and-results.md#image-preparation-limits)
for file limits, source restrictions and the distinction from whole-slide support. A matching
extension and backend are required; retrying alone does not add a missing capability.

## Resume unfinished work

An interrupted analysis may be able to continue, but recovery is not guaranteed.

1. Open **Jobs** and find the affected image.
2. Select **Details** to check what was saved and why the analysis stopped.
3. When offered, select **Continue analysis**, or **Reconnect to analysis** if work is still
   running in the cloud.

To stop instead, use **Stop analysis**, or **Cancel batch** for a running batch. Results already
saved to the project are kept; processed but unsaved results can be lost. If **Retry cloud
cancellation** appears, cancellation has not been confirmed. Use it rather than assuming the
cloud work has stopped. Closing QuPath is not confirmation that cloud work has stopped either.

Reopening the project does not restart analysis automatically. Only work already started with
recovery information can be continued. Images and regions not yet started must be selected again
after resolving the interrupted work.

Continue with the same extension build that started the analysis. Updating or replacing the JAR
can prevent continuation, even if its displayed version number is unchanged. Resolve unfinished
analysis before updating.

Continuation can also fail if uploaded files have expired or if relevant settings or image
objects have changed. Panning and zooming are safe. Resolve unfinished work before starting
another action that changes the same image; do not start a duplicate run to bypass it.

% Screenshot: analysis-recovery

## Training

| Problem | What to do |
|---|---|
| No model is available in **Train** | Follow [Choose a starting model](../training/choose-model.md). The module must be installed and its model supported for training by the connected backend; analysis support alone is not sufficient. |
| The project has no training ROIs | Draw regions with the **HistoForge ROI** tool, save the annotations, then select **Refresh** in **Train**. Ordinary rectangles and tissue-mask annotations are not training ROIs. |
| A training ROI contains too many objects | Replace it with smaller, non-overlapping HistoForge ROIs, review their labels, then select **Refresh**. See [Prepare training data](../training/prepare-data.md#annotate-the-images). |
| The split is **Outdated** | Refresh after changing annotations, generate the split again, and review both assignment tables. |
| A project-group split is unavailable | Assign a Group to every included image. Nonzero validation requires at least two groups. |
| Training submission was not confirmed | Check **Jobs** before submitting again; a cloud run may already exist. |
| Uploaded data is **In use** | Wait for its active training run to finish, or cancel the run in **Jobs**, before deleting the data. |
| Uploaded data says **Cleanup failed** | Open **Manage uploaded training data...**, select the dataset and use **Retry cleanup**. |

## Reporting a problem

Include the full error message, HistoForge and QuPath versions, module reference, analysis scope
and the steps needed to reproduce the problem. Remove identifying image names and other
restricted data.

Never include access tokens or `deployment.json`; that file contains the local backend
connection credential.
