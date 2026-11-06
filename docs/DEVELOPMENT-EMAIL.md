# Verify your preview account

Lumen requires email verification before sign-in. A GitHub Codespaces development preview writes email to a private local mailbox; it does not send a message to your real inbox unless an email provider has been configured.

1. Open Lumen from the browser editor's **Ports → Lumen / 3000 → Open in Browser** action. Keep the port **Private**.
2. Create your Lumen account. Seeing “Check your inbox” means the account was created and needs verification; it does not mean you are already signed in.
3. In the Codespace's browser editor, choose **Terminal → New Terminal** and run this command, replacing the address with the one you registered:

   ```sh
   npm run mail -- you@example.com
   ```

4. The command prints the newest development email for that address. Open its complete `https://…/api/auth/verify-email?…` link in the same browser you used for Lumen. You should return to Your Space, signed in.
5. If the account is verified but you are signed out, visit **Sign In** with your Lumen email and password.

The command runs on GitHub's remote computer. You do not need Node or npm installed on your own computer. The link contains a private verification token: do not share it, paste it into an issue, or expose the `.data` directory through a website.

You can also open the newest matching `.data/mail/*.json` file in the editor and copy its `url`. No public mailbox route exists.

## Resend verification or reset a password

For an unverified account, use **Resend verification email** on the registration confirmation screen, or open `/verify-email` in your Lumen preview. Enter the same address, then run `npm run mail -- you@example.com` again and use the newest message.

For a forgotten password, choose **Forgot password?**, request recovery, and run the same command. Open the newest reset link, enter a new password and sign in. Existing sessions are revoked after a successful reset.

Links expire after one hour. Request a new message if a link has expired or was already used. The CLI shows only the latest message for the address you explicitly choose.

## Address changed or login is rejected

Codespaces runs Lumen at a private HTTPS forwarded address. The app derives that exact address from GitHub's trusted environment variables; it does not trust a visitor-supplied host header or other Codespaces' origins. HTTPS previews use Secure, HttpOnly, SameSite=Lax cookies scoped to that exact host.

To apply this update, run `git pull --ff-only` in the Codespace terminal, then **stop and restart the Codespace**. Also restart after changing the preview address so the server uses its current address. This preserves the `.data` database and local mailbox. Open port 3000 through the Ports tab and request a fresh verification/reset message. A message from an old Codespace address cannot establish a session on the new host. The CLI warns when its newest message uses a different address.

If the startup script says port 3000 is already running with an unverified or older address, stop and restart the Codespace. If you manually started `npm run dev` in a terminal, stop that process with **Ctrl+C** before using `bash scripts/start-browser-preview.sh`.

Keep to one Lumen server per Codespace and do not run database migration commands while it uses the embedded database. Use the forwarded browser tab for sign-in and verification, rather than GitHub's repository page or `localhost` on your own computer.

## Production email

This mailbox is a development alternative. Production requires an explicit HTTPS `BETTER_AUTH_URL`, PostgreSQL, a strong auth secret, and configured `RESEND_API_KEY` plus `EMAIL_FROM`. Production refuses to initialise authentication without its email provider. Delivered production email and domain authentication must be tested separately before launch.
