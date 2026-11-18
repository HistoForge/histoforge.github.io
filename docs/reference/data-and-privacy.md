# Data and privacy

HistoForge runs analysis and training in your Modal workspace. Only use images your lab permits
you to upload to that workspace.

## Data flow

| Data | Where it goes |
|---|---|
| Slide image data | From your computer to your Modal workspace for analysis or training. |
| Slides opened from S3 | From your lab's S3 bucket to QuPath for viewing. Analysis and training still send image data from QuPath to Modal. |
| Training annotations and split | To your Modal workspace with the training dataset. |
| Module files and model weights | From Hugging Face to your Modal workspace. Module scripts also run locally in QuPath. |
| Model predictions | From Modal back to QuPath, where the objects are stored in the project's image data. |
| Exported measurements | To the local Excel file you choose. |
| A module you publish | From Modal to the Hugging Face repository you select, including any supporting files packaged with the module. |

Selecting an ROI does **not** guarantee that only that region's pixels are uploaded. A prepared
image can include pixels around the outline. An original-slide upload includes the entire slide,
its required companion files and embedded metadata, including data outside the selected region.
Only use a slide if you are permitted to upload those files in full. See
[Image preparation limits](../using-histoforge/actions-and-results.md#image-preparation-limits).

Publishing does not separately collect training images or your QuPath project. However, images
deliberately included in the module repository are published with its other supporting files.
[Review the files before publishing](../training/publish.md#publish-from-qupath).

Analysis uses your Modal workspace, not a shared HistoForge account. Access to its data depends on
workspace membership and permissions; a private workspace is still cloud storage.

## Cloud-slide access

[Open from Cloud](../using-histoforge/cloud-images.md) reads slide data from Amazon S3 using
your AWS sign-in. It stores connection details and sign-in tokens in HistoForge's local user
storage, separately from the QuPath project. The project stores image locations and analysis
data, not AWS sign-in tokens or a full copy of each S3 slide. Cloud-browser thumbnails are cached
on your computer.

**Edit Connection** clears the saved HistoForge AWS connection and tokens. It does not clear
cached thumbnails, sign out of the browser's AWS session, or delete S3 objects. Removing a
project image or deleting a Modal dataset does not delete the original S3 slide either.
Sharing a project does not grant its recipient access to the bucket.

Opening a cloud slide does not move model execution to S3. Analysis and training use the Modal
upload path described here; authorize both data destinations before running them.

## Uploaded analysis images

HistoForge requests removal of temporary analysis uploads after ordinary ROI work finishes.
Whole-slide and other recoverable work may retain its inputs so the work can resume.

The standard backend gives analysis uploads a maximum usable lifetime of 48 hours. The clock
starts when the backend reserves the upload, before it receives the image files. Completing the
upload does not restart the clock. An incomplete upload expires after one hour without activity.
The backend checks for expired analysis files every hour and also cleans expired uploads when
accepting new ones.
Stopping the backend prevents its scheduled cleanup but does not extend upload expiry. Expired
uploads cannot be reused even if their files remain in storage.

These limits do not promise physical deletion at the expiry time: a stopped backend or failed
cleanup can leave files stored longer. They do not apply to the training datasets described below.

## Delete uploaded training data

Uploaded training datasets remain in Modal until you delete them. They count toward your Volume
storage usage and can incur charges above the included allowance; see [Storage costs](../getting-started/modal.md#storage-costs).
Deleting unused data reduces retained storage, not charges already incurred.

1. Open **Train → Manage uploaded training data...**.
2. Select the dataset and check its creation date and stored size.
3. Select **Delete** and confirm the dataset shown in the dialog.
4. Check that it disappears from the list. If the status is **Cleanup failed**, select
   **Retry cleanup** and inspect any reported error.

Data marked **In use** cannot be deleted while an active training run uses it. Deleting a dataset
does not delete your QuPath project or completed module. Training on the same data later requires
uploading it again.

% Screenshot: training-data-cleanup

## Job history, modules and published copies

These are separate items:

- **Jobs → Clear history** removes the selected job record and its run details. It does not
  delete an uploaded training dataset or the completed module and its report.
- **Modules → ⋯ → Remove module…** removes the installed module from your Modal workspace. Save or
  publish a private trained result before deleting it if you need to keep it.
- A **published Hugging Face repository** is a separate copy. Removing a module from Modal does
  not remove its Hugging Face repository.
- **QuPath project files and exported Excel files** remain wherever you saved them. Keep your
  own backups; clearing cloud data does not back up or remove these local files.

## Credentials

% Revision: HF-SETUP

Enter your Hugging Face token in HistoForge's token field in QuPath and select **Save token**.
You can replace it later in HistoForge's **Settings**. HistoForge stores it
as a Modal Secret in your workspace, not in your project or setup logs. It authorizes downloads
and publication, so do not include it in screenshots or support messages. See
[Install and connect](../getting-started/installation.md#connect-the-backend).

Module scripts execute inside QuPath with access to local files and the network. Only install
modules whose source you trust.
