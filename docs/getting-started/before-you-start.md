# Prerequisites

You need QuPath, an internet connection, and accounts with Modal and Hugging Face. The next pages
walk through both account setups.

## What you need

- **[QuPath](https://qupath.github.io/)** 0.6.0 or 0.7.0 and the HistoForge extension JAR.
  The same JAR is used for both versions; there are no separate Windows and macOS JARs.
- **[Modal](https://modal.com/):** runs analysis and training, and stores uploaded data and models
  in your workspace. [Set up Modal and a spending limit](modal.md).
- **[Hugging Face](https://huggingface.co/):** hosts modules and model files. HistoForge uses an
  access token to download and publish them. [Set up your token](hugging-face.md).

For the first analysis, prepare a saved QuPath project containing one representative image.
You do not need to choose or install a module until setup is complete.

## Open a local image

1. Add the image to your QuPath project using **Default (let QuPath decide)**. If QuPath offers
   several images or scenes, select the tissue image you want to analyze.
2. Open the image and check its appearance at several zoom levels.
3. Check that QuPath reports the correct pixel width and height in micrometers. Incorrect
   calibration affects both model input and physical measurements.
4. Save the project.

Keep the slide and any companion files together, with their original names and folder structure.
HistoForge uses the image and reader selected in QuPath and collects the required files when
uploading an original slide.

% Screenshot: local-image-import

### Tested image examples

Examples from these format families have been tested for image reading. This does not guarantee
that every file variant, operating system or analysis module will work with them.

| Format family | Files to keep together |
|---|---|
| SVS, including JPEG2000; NDPI | The slide file. |
| Generic, Philips, Trestle and Huron TIFF | The slide file. |
| SCN, CZI and BIF | The slide file; select the intended RGB tissue image if several are offered. |
| MRXS | The `.mrxs` file and its same-named companion folder. |
| VSI | The `.vsi` file and its companion files and folders. |
| OME-TIFF | The main file and any companion files. |

Opening a file in QuPath does not by itself establish that HistoForge can analyze it. Start with
a small region and check the [image preparation limits](../using-histoforge/actions-and-results.md#image-preparation-limits).
Slides opened directly from S3 have [separate format restrictions](cloud-image-compatibility).

## Images and image planes

Use a calibrated, 8-bit RGB color image for the first analysis. HistoForge analyzes only the first
z-plane and first time point (`z=0, t=0`); it does not perform 3D or stack-wide analysis.

Whole-slide analysis uses that first plane even if another plane is displayed in QuPath. For
ROI analysis and training, ROIs on other planes are rejected rather than moved to the first plane.

Image data is processed in your Modal workspace. Read [Data and privacy](../reference/data-and-privacy.md)
before uploading images.
