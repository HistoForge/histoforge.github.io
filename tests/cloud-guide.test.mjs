import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const user = read("docs/using-histoforge/cloud-images.md");
const admin = read("docs/using-histoforge/cloud-aws-setup.md");

test("the cloud policy is valid JSON and restricts listing and reads to one prefix", () => {
  const policy = JSON.parse(admin.match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(policy.Version, "2012-10-17");
  assert.deepEqual(policy.Statement, [
    {
      Sid: "ListSlideFolder", Effect: "Allow", Action: "s3:ListBucket",
      Resource: "arn:aws:s3:::YOUR_BUCKET_NAME",
      Condition: {StringLike: {"s3:prefix": "slides/*"}},
    },
    {
      Sid: "ReadSlideObjects", Effect: "Allow",
      Action: ["s3:GetObject", "s3:GetObjectVersion"],
      Resource: "arn:aws:s3:::YOUR_BUCKET_NAME/slides/*",
    },
  ]);
});

test("cloud guidance preserves the actual sign-in, scope and privacy boundaries", () => {
  for (const label of ["SSO Start URL", "AWS Region", "Bucket", "Key prefix (optional)",
    "Sign In with AWS", "Add to Project", "Edit Connection"]) {
    assert.ok(user.includes(`**${label}**`), `Missing UI label: ${label}`);
  }
  assert.match(user, /first AWS account and first role returned by AWS/);
  assert.match(user, /no\s+separate bucket-region field/);
  assert.match(user, /filename\s+filter, not a guarantee/);
  assert.match(user, /does \*\*not\*\* add it to the\s+project/);
  assert.match(admin, /budget alert is not a spending cap/);
  assert.match(admin, /organization instance/);
  assert.match(admin, /not a bucket policy/);
  assert.match(read("docs/reference/data-and-privacy.md"), /thumbnails are cached\s+on your computer/);
});
