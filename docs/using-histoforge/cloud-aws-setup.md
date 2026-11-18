# Set up AWS for cloud slides

This guide is for the person administering your lab's AWS storage and access. If the bucket and
sign-in are already configured, follow [Open images from cloud storage](cloud-images.md).

The result is a private S3 folder that researchers can list and read through AWS single sign-on.
It does not deploy HistoForge's Modal backend or grant researchers permission to upload or delete
slides. Use a separate administrator or upload identity to maintain the image collection.

## 1. Check the account, region and costs

Use your institution's existing AWS account and identity setup where available. You need
administrative permission to manage the bucket and Identity Center assignments. If no account
exists, follow [AWS account setup](https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html#setting-up-s3)
before continuing. Keep administrative access separate from the researcher login.

This example covers a general purpose S3 bucket in the account assigned to the researcher, in
the same region as IAM Identity Center. Read the
[current connection constraints](cloud-connection-constraints) first. Do not
remove existing institutional permissions or relocate data merely to follow this example.
Cross-account storage or identities with several account/role assignments need separate review.

S3 storage, requests and data transfer can incur charges. Browsing thumbnails and panning or
zooming generate reads; these costs are separate from Modal. Check
[S3 pricing](https://aws.amazon.com/s3/pricing/) for the chosen region and storage class.
Configure [AWS Budgets notifications](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
before loading a collection. **A budget alert is not a spending cap**, and billing notifications
can arrive after the threshold has been exceeded.

## 2. Configure IAM Identity Center

IAM Identity Center manages sign-in and assigns access to AWS accounts. A **permission set**
defines the permissions of the role a researcher receives in an account.

Before enabling AWS Organizations for a new standalone account, review the billing notice in
[AWS's enablement instructions](https://docs.aws.amazon.com/singlesignon/latest/userguide/enable-identity-center.html):
creating an organization can change the account's plan and free-tier eligibility. Do not assume
that this setup stays within a free trial.

1. Open **IAM Identity Center** in the AWS console. If your organization already uses it, work
   with its administrator; do not create a competing identity setup.
2. For a new setup, follow AWS's
   [enablement instructions](https://docs.aws.amazon.com/singlesignon/latest/userguide/enable-identity-center.html)
   for an **organization instance**, with **multi-account permissions** enabled. An account
   instance intended only for application sign-in does not provide the permission-set account
   access used by HistoForge.
3. Record the Identity Center region and **AWS access portal URL** for the researcher.
4. Use the existing institutional identity provider. For a new Identity Center directory,
   choose **Users → Add user**, enter the researcher's details and send the invitation. Have the
   researcher activate their login. See [AWS user setup](https://docs.aws.amazon.com/singlesignon/latest/userguide/addusers.html).
5. Put researchers in a group managed by your administrator, or assign the individual user in
   [Assign the researcher to the account](#5-assign-the-researcher-to-the-account). Use your
   institution's multi-factor authentication requirements.

## 3. Create the private bucket and upload a test slide

If the bucket already exists, verify these settings instead of creating another one.

1. Open **Amazon S3 → General purpose buckets → Create bucket**.
2. Choose the same region used for this HistoForge sign-in connection and an available bucket
   name. Do not put patient or study identifiers in the name.
3. Keep **Block all public access** enabled and **Object Ownership** set to
   **Bucket owner enforced**. Do not enable public access or object ACLs to resolve a login error.
4. Keep encryption enabled. For a new bucket, S3-managed encryption (**SSE-S3**) works without
   separate KMS permissions. If your institution requires KMS, retain that requirement and
   configure key access as described below.
5. Create the bucket. See [AWS's bucket instructions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/GetStartedWithS3.html#creating-bucket).
6. In the bucket's **Objects** tab, create a folder named `slides`, open it, and use **Upload**
   to add one permitted test slide. Keep it in an immediately readable storage class such as
   **S3 Standard**. See [AWS upload instructions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html).

The examples below use the prefix `slides/`. A file named `example.tif` inside that folder has
the object key `slides/example.tif`. A prefix is a case-sensitive path filter, not a separate
bucket. Choose a test image meeting the [cloud reader's requirements](cloud-image-compatibility).

## 4. Create a restricted read-only permission set

1. In **IAM Identity Center**, open **Permission sets → Create permission set**.
2. Select **Custom permission set**, then open **Inline policy**.
3. Paste the policy below. Replace both instances of `YOUR_BUCKET_NAME` with the actual bucket
   name. If using a different folder, replace `slides/` in both the condition and object path.
4. Name the permission set `HistoForgeSlideReader`, review it and create it. This is a suggested
   name, not a value HistoForge requires. See [AWS permission-set instructions](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtocreatepermissionset.html).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListSlideFolder",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME",
      "Condition": {
        "StringLike": {"s3:prefix": "slides/*"}
      }
    },
    {
      "Sid": "ReadSlideObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:GetObjectVersion"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/slides/*"
    }
  ]
}
```

This grants listing only within `slides/` and reading its objects, including stored versions.
It grants no upload, deletion, whole-account bucket listing or administrative access. HistoForge
uses an object's version when available, so versioned reads need
[`s3:GetObjectVersion`](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html).
The listing condition follows AWS's [prefix-restricted policy pattern](https://docs.aws.amazon.com/AmazonS3/latest/userguide/walkthrough1.html).

This is an identity policy attached to the permission set, **not a bucket policy**. Existing
bucket policies, organization restrictions and permission boundaries may still deny a request;
do not remove those safeguards just to make the example work. The policy does not grant access
to other prefixes, but it also does not cancel permissions granted by other policies.

### If the slides use KMS encryption

The S3-only policy above is insufficient for KMS-encrypted objects. The administrator must also
authorize the researcher role to decrypt (`kms:Decrypt`) with the exact KMS key, including the
applicable key policy. Scope that access to the required key; do not grant access to every key or disable
encryption. See [AWS's SSE-KMS permissions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html).

## 5. Assign the researcher to the account

1. In **IAM Identity Center → AWS accounts**, select the account containing the bucket.
2. Choose **Assign users or groups** and select the researcher or their group.
3. Select `HistoForgeSlideReader`, review the assignment and submit it.
4. Wait for the assignment to finish. Ask the researcher to sign in to the access portal and
   confirm that the intended account and role are available. Creating a user or permission set
   alone does not complete the assignment.

Follow [AWS's account-assignment procedure](https://docs.aws.amazon.com/singlesignon/latest/userguide/assignusers.html).
Check direct **and group-derived** assignments: HistoForge currently takes the first returned
account and role. Do not assume choosing a role in the web console chooses it for HistoForge.
If several are available, resolve the connection limitation before using this workflow.

## 6. Hand over and verify

Give the researcher the portal URL, region, bucket name and exact prefix `slides/`. Also provide
the test slide's filename and expected pixel calibration. Do not send administrative credentials
or long-lived access keys.

Using the **researcher's login**, follow [Sign in](cloud-images.md#sign-in), add the test slide to
a project, inspect it at several zoom levels, save, and reopen the project. Check that the image
still opens after signing in again. Do not count an administrator's successful access as proof
that the researcher permissions work.

Keep source object names and contents stable during a study. Project entries refer to S3
locations; moving, replacing, deleting or archiving those objects can break access or change
what opens later. Agree on retention and storage costs with the collection owner before adding
the full study. Analysis and training require a separate check of the Modal connection and
permission to transfer the image data there.
