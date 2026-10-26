# Install and connect

Before installing, finish [Modal setup](modal.md) and
[create your Hugging Face token](hugging-face.md#create-an-access-token).

## Install the extension

If you are updating an existing installation, finish or stop unfinished analysis in **Jobs**
before replacing the JAR. An interrupted analysis requires the same extension build to continue;
installing a newer JAR does not transfer it to the new build. See
[Resume unfinished work](../reference/troubleshooting.md#resume-unfinished-work) for the controls.

1. [Download HistoForge 0.2.2](https://github.com/HistoForge/histoforge-qupath-extension/releases/download/v0.2.2/histoforge-extension-0.2.2-all.jar). Use the same file with QuPath 0.6.0 or 0.7.0.
2. Drag the JAR onto the QuPath window and accept the installation.
3. Restart QuPath.

The menu **Extensions → HistoForge → Open HistoForge** should now appear. If it does not, resolve
the extension installation before continuing. QuPath documents
[manual extension installation](https://qupath.readthedocs.io/en/stable/docs/intro/extensions.html#managing-extensions-without-the-extension-manager).

The [HistoForge catalog](https://github.com/HistoForge/histoforge-qupath-extension/releases/latest/download/catalog.json)
is also available for QuPath’s extension manager.

Replacing the JAR does not update the cloud backend. That is a separate action:
**Settings → Update cloud backend**. Read the [update guidance](../reference/troubleshooting.md#connection)
before confirming: updating cancels unfinished analysis and training.

## Connect the backend

% Revision: HF-SETUP

The **backend** is the HistoForge software running in your Modal workspace. QuPath connects to it
to install modules and run models.

The **Project** and **Jobs** tabs are available without a cloud connection.

If another QuPath session uses the same backend, finish its cloud work before connecting here:
a new connection can disconnect that session. See [Connection](../reference/troubleshooting.md#connection).

1. Open **Extensions → HistoForge → Open HistoForge**.
2. Select **Set up cloud** in the banner to open the setup screen.
3. Paste your Hugging Face token into **Enter or replace token** and select **Save token**.
4. Approve **Install runtime helper** if prompted.
5. Complete the Modal sign-in in your browser if asked.
6. Wait for **Token verified and saved. Set up your backend next.**
7. Select **Set up backend**.
8. Keep QuPath open until setup finishes.

HistoForge stores the token as a **Modal Secret**, a credential kept in your cloud workspace,
and verifies the token. You do not need to create the Secret manually. The token is not saved in
your QuPath project or written to setup logs.

If you already use Modal on this computer, setup uses its existing account configuration.
QuPath does not ask you to choose a workspace. Check that you are using the intended Modal
workspace before saving the token or deploying the backend.

% Screenshot: setup-hugging-face-token

Setup installs the local software needed to communicate with Modal, then connects to or deploys
HistoForge in the configured workspace.

When setup finishes, hover over the status dot at the top right. Its tooltip shows **Connected**
when HistoForge can reach the backend. You can then use **Modules** and **Train**.
If setup fails, use the message to find the relevant
[troubleshooting instructions](../reference/troubleshooting.md#connection).

% Screenshot: setup-connected

Setup is complete. Continue to [choose and install a module](../using-histoforge/modules.md).
