# Deploy on projectonboard.thedolphy.com

This is a full-stack Next.js application. It needs Hostinger's Node.js runtime and MySQL; a static `public_html` upload cannot run the submission API or dashboard.

## 1. Create the database

In hPanel, open **Websites → Dashboard → Databases → Management**. Create a MySQL database and user, then keep the database name, username, password and host. Hostinger documents this flow in its [MySQL and Node.js guide](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).

The app creates the `project_submissions` table and indexes automatically on its first successful connection. No phpMyAdmin import is required.

## 2. Add the subdomain as a separate website

In **Websites → Add Website**, choose **Deploy Web App** and enter `projectonboard.thedolphy.com`. Treat it as an independent website so the existing `thedolphy.com` files and settings stay isolated. Hostinger recommends the independent-website method for standalone applications in its [subdomain guide](https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/).

If the domain uses Hostinger nameservers, DNS is normally created automatically. If DNS is managed elsewhere, add only the required `projectonboard` record there; keep the existing apex, `www`, email and other records intact.

## 3. Upload and build

Choose **Upload your website files** and upload `dist/dolphy-project-onboard-hostinger.zip`. Hostinger supports ZIP deployment for existing Next.js apps on supported Business and Cloud plans; see its [Node.js deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

Use these settings if Hostinger asks:

- Framework: Next.js
- Node.js: 22.x
- Project root: `.`
- Install: `npm ci`
- Build: `npm run build`
- Output: `.next`
- Start: `npm run start`

## 4. Configure environment variables

Add these through the deployment's environment-variable screen. Never commit or place them in frontend code.

```dotenv
APP_ORIGIN=https://projectonboard.thedolphy.com
DATABASE_URL=mysql://DATABASE_USER:DATABASE_PASSWORD@DATABASE_HOST:3306/DATABASE_NAME
ADMIN_USERNAME=dolphyadmin
ADMIN_PASSWORD_SALT=generated_value
ADMIN_PASSWORD_HASH=generated_value
```

The requested admin password has already been converted to the two generated values in the local `.env.local`. Copy those values into Hostinger without uploading `.env.local`. Hostinger supports pasting environment variables during deployment and keeps them outside the repository, as described in its [environment-variable guide](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/).

If the MySQL username or password includes URL-reserved characters such as `@`, `:`, `/`, `?` or `#`, URL-encode those parts before constructing `DATABASE_URL`.

## 5. Launch check

1. Wait for a successful build and HTTPS certificate.
2. Open `https://projectonboard.thedolphy.com` on desktop and a real phone.
3. Submit one labelled test brief and confirm the success screen.
4. Sign in at `https://projectonboard.thedolphy.com/admin` and confirm every answer is present.
5. Confirm a second submit with the same submission ID does not create a duplicate.
6. Confirm `https://thedolphy.com` still serves the existing site.
7. Remove the labelled test row through phpMyAdmin after verification if desired.

Do not share the client link until the real MySQL insertion and dashboard read have both succeeded.

## Package after future changes

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

The package includes source, tests and the lockfile. It excludes dependencies, build caches, screenshots and `.env.local`.
