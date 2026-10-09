This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy (Vercel + TiDB Cloud Serverless)

TLS is enabled automatically when the `DATABASE_URL` host ends with `tidbcloud.com` (`db/connection.ts`); local MAMP stays plain.

1. Vercel project, Environment Variables: `DATABASE_URL` (`mysql://user:pass@gateway01.<region>.prod.aws.tidbcloud.com:4000/<db>`), `SESSION_SECRET` (`openssl rand -hex 32`), `ADMIN_PASSWORD`.
2. Create schema and seed from your machine (Vercel does not run these):
   ```bash
   DATABASE_URL='mysql://...tidbcloud.com:4000/<db>' ADMIN_PASSWORD='...' npm run db:migrate
   DATABASE_URL='mysql://...tidbcloud.com:4000/<db>' ADMIN_PASSWORD='...' npm run db:seed
   ```
   `db:seed` loads `.env.local` with `--env-file`; variables passed in the shell take precedence over it.
3. Deploy: push to `main` (Vercel Git integration runs `npm run build`), or `npx vercel --prod`.
