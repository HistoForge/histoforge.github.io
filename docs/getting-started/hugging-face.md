# Set up Hugging Face

[Hugging Face](https://huggingface.co/) stores modules in repositories, addressed as `owner/name`.
HistoForge needs permission to read the repositories it downloads and to write to repositories
where you publish modules.

## Create an access token

1. [Create a Hugging Face account](https://huggingface.co/join), or sign in to an existing account.
2. Open **Settings → [Access Tokens](https://huggingface.co/settings/tokens)** and create a new token.
3. Name it `HistoForge` so you can identify its purpose later.
4. Choose the **Write** role for the full download-and-publish workflow. This role includes read
   access and permission to create or update repositories your account can write to.
5. Create the token and copy it for HistoForge setup in QuPath. Treat it as a password.

A Write token can modify any repository your account can write to. For narrower access, or if
your organization requires it, use a **fine-grained** token with read access to source repositories
and read/write access to the intended publication destination. Creating a new repository also
requires permission in its owner account or organization. See
[Hugging Face's token guide](https://huggingface.co/docs/hub/security-tokens).

No Hugging Face inference, billing or organization-administration permissions are needed.
HistoForge runs the models in Modal. Gated model repositories still require your account to be
granted access; a token does not bypass that approval.
An organization may also require administrator approval of the token itself.

% Screenshot: hugging-face-token

## Connect it during HistoForge setup

% Revision: HF-SETUP

During [Install and connect](installation.md#connect-the-backend), enter the token in QuPath and
select **Save token** before **Set up backend**. The installation guide explains how it is stored
and checked.

Do not include the token in a project file, screenshot or support message.

Next, [install HistoForge and connect](installation.md).
