# Open images from cloud storage

Use **Open from Cloud** to browse slides stored in your lab's Amazon S3 bucket and add them to
a QuPath project. S3 holds the slide files; Modal runs HistoForge analysis and training. These
are separate connections. You do not need AWS to work with local images.

If your lab has not configured AWS access, give your administrator
[Set up AWS for cloud slides](cloud-aws-setup.md). HistoForge does not create the AWS account,
bucket or sign-in permissions for you.

```{toctree}
:hidden:
:maxdepth: 1

cloud-aws-setup
```

## Before you connect

Install the [HistoForge extension](../getting-started/installation.md#install-the-extension).
Create or open a saved QuPath project. You need an internet connection and a browser for AWS
sign-in. Connecting the Modal backend is required for analysis and training, not for browsing S3.

Ask your administrator for these values:

| Field in HistoForge | What to enter |
| --- | --- |
| **SSO Start URL** | Your lab's AWS access portal URL, not the general AWS console sign-in page. |
| **AWS Region** | The region used for this connection, for example `us-east-1`. See the constraints below. |
| **Bucket** | The bucket name only, without `s3://` or a folder path. A bucket is the container holding the files. |
| **Key prefix (optional)** | The beginning of the files' paths inside the bucket, such as `slides/`. Include the trailing `/` when restricting access to a folder. |

Your login must have permission to list the intended folder and read its slides. HistoForge uses
AWS IAM Identity Center, AWS's single sign-on service. It does not offer an access-key or
secret-key entry field.

(cloud-connection-constraints)=
### Current connection constraints

- HistoForge selects the **first AWS account and first role returned by AWS**. There is no
  account or role chooser. If your sign-in has multiple account or role assignments, do not
  rely on their order: ask your administrator to review this limitation before proceeding.
- The **AWS Region** value configures both the sign-in service and the S3 client. There is no
  separate bucket-region field. This guide uses a bucket in the same region as Identity Center.
- There is one active AWS connection per QuPath session. Changing it can prevent previously
  opened cloud slides from loading if the new identity cannot read them.

## Sign in

1. Choose **Extensions → HistoForge → Open from Cloud...** to open the connection dialog.
2. Enter the four values above. If your access is restricted to `slides/`, do not leave
   **Key prefix (optional)** blank: a whole-bucket listing may be denied.
3. Select **Sign In with AWS**.
4. Complete your lab's sign-in and any approval or multi-factor authentication prompts in the
   browser. Do not enter AWS passwords in HistoForge.
5. Return to QuPath. Check the bucket and prefix shown above the slide list.

The slide list confirms that listing succeeded. Opening an image is a separate check of read
permissions and file compatibility.

% Screenshot: cloud-sign-in

## Add slides to your project

1. Enter part of a filename in **Search slides...** and select **Search**, if needed.
2. Check the slides to add. **Select All** selects every slide matching the current filter,
   including those on other pages. Review the **Selected** filter before a large import.
3. Select **Add to Project**.
4. Check that the expected images appear in QuPath's project list. If a project-save error is
   reported, use **Save Project & Refresh** to retry saving before closing QuPath.
5. Open one image from the project list. Check its tissue appearance at several zoom levels and
   verify the pixel width and height in micrometers against the scanner's calibration.

Adding slides stores references to their S3 locations, not full slide copies in the project.
Double-clicking a slide in the cloud browser opens it for viewing; it does **not** add it to the
project. Use **Add to Project** before starting a study.

(cloud-image-compatibility)=
### Check image compatibility

The browser lists `.tif`, `.tiff`, `.svs`, `.ome.tif` and `.ome.tiff` filenames. This is a filename
filter, not a guarantee that every such file can be read. The cloud reader is designed for
pyramidal RGB TIFF images with JPEG-encoded tiles; it does not provide all of QuPath's local
image readers or general OME multidimensional support.

Do not analyze an image with missing tiles, unexpected colors or incorrect calibration. Ask for
a compatible image export or open a permitted local copy with QuPath's usual reader. HistoForge's
[image-plane restrictions](../getting-started/before-you-start.md#images-and-image-planes) still
apply.

Start analysis with a small region. For S3 slides, HistoForge prepares image data through QuPath;
it cannot send the original S3 file directly to Modal. Larger regions and whole slides still need
supported models and must meet the [image preparation limits](actions-and-results.md#image-preparation-limits).
For a downloaded local copy, follow the [local image guidance](../getting-started/before-you-start.md#open-a-local-image),
including its companion-file requirements. Downloading alone does not establish compatibility.

Once the image is checked, continue to [choose a module](modules.md) and
[run your first analysis](../getting-started/first-analysis.md).

## Reopen or change the connection

HistoForge saves the connection details and AWS sign-in tokens on your computer and tries to
restore the session when QuPath starts. If a project image reports that you are not signed in,
open **Open from Cloud...**, sign in, then reopen the image from the project.

To use different connection details, select **Edit Connection** in the cloud browser. This
clears HistoForge's saved AWS connection and tokens and returns to the sign-in form. It does not
delete S3 files, project entries or cached thumbnails, or sign you out of the browser's AWS
session. See [Data and privacy](../reference/data-and-privacy.md#cloud-slide-access).

## Troubleshooting

| What you see | What to check |
| --- | --- |
| No AWS accounts or no roles found | Ask the administrator to check your Identity Center account assignment and permission set. A portal login alone does not grant S3 access. |
| **No slides found** | Check the bucket, case-sensitive prefix, filename search and filter. Confirm that the folder contains one of the listed filename extensions. |
| **Session Expired** or access denied repeatedly | Sign in again once. If it repeats, ask the administrator to check the selected account/role, prefix restriction, object permissions and any encryption-key policy. HistoForge can report an S3 access denial as session expiry. |
| An image opens with blank or missing areas | Stop analysis and check file compatibility and calibration. |
| A large region or whole slide reports a size limit | Follow [Image-size limits](prepared-image-exceeds-the-size-limit). Signing in again does not resolve an oversized input. |
| **Please create a project first** | Create or open a saved QuPath project, then use **Add to Project** again. |

Do not share passwords, sign-in tokens or unredacted logs containing private slide locations.
