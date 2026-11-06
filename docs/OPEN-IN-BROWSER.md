# Open Lumen without installing software

Use GitHub Codespaces to run Lumen on GitHub's computer and view it in your browser. Your computer does not need Node.js, npm, Git or Docker. This is a private development preview, rather than a permanent hosted production site.

1. Sign in to GitHub and [open the Codespace creation page](https://codespaces.new/Seb-Simpson/Lumen?ref=feat%2Flumen-foundation).
2. Check the repository is **Seb-Simpson/Lumen** and branch is **feat/lumen-foundation**. Review the billing owner and your included Codespaces usage before selecting **Create codespace**. No Codespace or paid service has been created automatically by this change.
3. Wait for setup to install dependencies and start the app. The repository configuration supplies Node.js 24 on the remote computer.
4. If Lumen does not open automatically, select the **Ports** tab in the browser editor and click **Open in Browser** for **Lumen / 3000**. Keep visibility **Private** so GitHub controls access to the preview.

The startup script derives the preview's HTTPS address from GitHub's environment variables. Authentication, verification links and development assets use that address instead of your computer's localhost. The private database and development emails persist under `.data` in that Codespace.

## Creating a Lumen account

This preview writes verification and password-recovery emails to a private mailbox on the remote computer. It does not send to your actual inbox by default. After registering, open **Terminal → New Terminal** in the browser editor and run:

```sh
npm run mail -- you@example.com
```

Replace the address with your Lumen account email, then open the newest link printed by the command in the same browser. Registration requires this verification step before sign-in. No installation on your computer is needed. [Step-by-step verification and password recovery](DEVELOPMENT-EMAIL.md).

You can also open your newest matching message in **.data → mail** in the file explorer and open its `url`. These token-bearing links are private; do not share them or make the preview port public.

## If setup is still running

The first creation can take several minutes. Check **.data/browser-preview.log** in the editor for the server's startup output. Once setup completes, port 3000 should appear. To start the app when no server is running, use the browser editor's terminal to run `bash scripts/start-browser-preview.sh`; npm is already installed remotely. If the app is running with an older preview address, stop and restart the Codespace so its login URL is refreshed. Your `.data` library remains in the workspace. If you manually started `npm run dev` in another terminal, stop it there with **Ctrl+C** before starting another server.

## Finishing your session

Use GitHub's **Stop codespace** action when finished. Closing the browser tab does not necessarily stop the remote computer immediately. Check usage and delete unused Codespaces/storage at https://github.com/codespaces. Stay within your included allowance if you do not want paid usage. A blocked `github.dev` / `app.github.dev` domain would still need your network administrator's approval.

This setup was checked with local startup/configuration tests; an actual user-owned Codespace has not been created or billed for testing. GitHub manages its provisioning and port access. Production email delivery, hosted PostgreSQL and a permanent public deployment remain separate setup work.

References: [GitHub browser setup](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository?tool=webui), [port forwarding](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace), [Codespaces billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-codespaces/about-billing-for-github-codespaces).
