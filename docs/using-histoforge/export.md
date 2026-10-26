# Export to Excel

Export creates an Excel workbook (`.xlsx`) for the checked images and selected analysis scope.
Each selected image needs an installed module that defines measurements.

## Prepare the selection

1. In **Project**, check the images to include.
2. Confirm the assigned modules and choose **Scope**.
3. For **HistoForge ROIs**, confirm that each image has at least one saved ROI.
4. Review and save any object corrections.

For **Annotations by class**, choose the same annotation class used for analysis. Every checked
image needs matching area annotations. Selecting an annotation in the viewer does not limit
the export to that annotation.

To label study groups, check the images in a group and select **Assign Group**. Enter the group
name, then repeat for other groups. The workbook includes these labels; images without a group
are listed as **Ungrouped**.

## Save the Excel file

1. Select **Export**, choose a destination, and save the file with the `.xlsx` extension.
2. If the file already exists, confirm replacement.
3. Wait for the export confirmation, then open the file in Excel or another `.xlsx` reader.

Export uses the QuPath objects captured when the export starts. It reuses measurements only if
they match those objects exactly; otherwise it recomputes them. It does not run models or processing
scripts. If a requested region fails, HistoForge does not write an incomplete workbook over the
destination.

## Read the workbook

| Sheet | Contents |
|---|---|
| **Summary** | Measurements aggregated across regions for each image and module, with units and coverage counts. |
| **Per Region** | Measurements for each ROI or whole-slide region. |
| **Raw Distribution** | Individual values for measurements that return a distribution. |
| **Coverage** | Counts of requested, present, missing and failed regions for each measurement. |
| **Evidence** | The image-state, module, script and software records associated with the exported measurements. |

% Screenshot: export-workbook

Before using the values, check the image names, study groups, module references, units and
**Coverage** sheet. Keep **Evidence** with the measurement sheets.

A count of zero means no matching objects. An empty distribution contains no observations and
has no mean; a missing value is undefined or unavailable. Do not replace missing values with
zero during data cleaning. The module defines how measurements are combined across regions;
check its documentation before interpreting a summary.

The exported values describe the objects you reviewed, including any manual corrections.
