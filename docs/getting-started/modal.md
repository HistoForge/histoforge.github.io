# Set up Modal

[Modal](https://modal.com/) provides the cloud computers and storage used by HistoForge. Your
**workspace** holds the HistoForge backend, uploaded data and installed modules.

## Create or choose a workspace

1. Open [Modal](https://modal.com/) and select **Get Started** to create an account, or sign in.
2. Complete the account setup. Modal creates a workspace for a new account.
3. Check the workspace selector in the dashboard. If your lab already has a workspace, ask its
   owner to invite you and select that workspace instead.

Use this same workspace when connecting HistoForge. Modal's
[workspace guide](https://modal.com/docs/guide/workspaces) explains invitations and roles.

% Screenshot: modal-workspace

## Set a spending limit

Set a spending limit before running analysis or training. Modal's Starter plan includes
**$30 per month in compute credits** as of 13 October 2026. Credits are not a spending cap;
check your workspace's available credits and [current pricing](https://modal.com/pricing).

1. Open **Usage & Billing** in the Modal dashboard.
2. Set the workspace **spend limit** to the maximum you are willing to pay during a billing cycle.
3. Save the setting and check that the intended limit is displayed.

The spend limit caps charges after credits. When it is reached, Modal stops workloads that would
add out-of-pocket charges. A workspace owner or manager must configure it. Modal also has a
**usage limit**, which counts usage before credits; see
[Modal's budget instructions](https://modal.com/docs/guide/budgets) for the distinction.

% Screenshot: modal-spending-limit

(costs-while-histoforge-is-idle)=
## Costs when you are not using HistoForge

[Modal turns off unused cloud computers automatically](https://modal.com/docs/guide/scale).
You are not charged for those computers while they are off.

HistoForge still checks for expired temporary analysis files every hour and deletes them.
These checks continue after you close QuPath and count toward your Modal usage.

**Cost example:** two minutes of computer time each hour, using minimal computing power, would
cost about **$0.20 over 30 days**, before free credits. This is an illustration, not a measured
monthly bill. Longer checks or heavier computer use cost more. The calculation uses
[Modal's prices on 13 October 2026](https://modal.com/pricing).

If you have free computing credits left, they cover these checks. Stored files may still incur
separate storage charges, explained below.

% Cost example: 30 days * 24 checks/day * 2 containers * 60 billed seconds/container *
% (0.125 physical CPU cores * $0.0000131/core-second + 0.125 GiB * $0.00000222/GiB-second)
% = $0.165456, rounded to $0.20. Both containers use Modal's default resource requests.
% Reference: https://modal.com/docs/guide/resources. One minute per container is an assumption,
% not a runtime measurement; the default 60-second idle window is also billable.

Modal's **Stop app** stops HistoForge's cloud service, not just the cleanup checks. Reopening
QuPath will not restart it. Read {ref}`Stopping HistoForge <stopping-the-backend>` before using it.

## Storage costs

Modal includes **1 TiB (1,024 GiB) of Volume storage per month** at no charge. Additional storage
costs **$0.09 per GiB per month**, according to its [pricing](https://modal.com/pricing) on
13 October 2026. Stored datasets and model files contribute to this usage.

Training data remains in your workspace after a run. Remove it when no longer needed to free
storage and reduce possible ongoing storage charges, using
[Manage uploaded training data](../reference/data-and-privacy.md#delete-uploaded-training-data).
Deletion does not reverse charges already incurred; Modal may continue accounting for deleted
Volume data for up to four days. See [Volume storage billing](https://modal.com/docs/guide/volumes#pricing).

% Revision: HF-SETUP

Next, [create a Hugging Face token](hugging-face.md). You will provide it during HistoForge setup
in QuPath.
