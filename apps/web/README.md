This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Start the Python API on port 3001 using the [API instructions](../../services/api/README.md),
then run `pnpm dev` here. The home page's **Get files** button requests `/files`;
Next.js forwards it to the backend's `/files/` endpoint so the browser uses the
same origin and does not require backend CORS configuration.

The backend defaults to `http://127.0.0.1:3001`. To use a different backend, copy
`.env.example` to `.env.local`, set `API_BASE_URL`, and restart Next.js. For a
production deployment, set this variable before building. It is a server-side
setting and does not need a `NEXT_PUBLIC_` prefix.

The upload form accepts nonempty PDF/TXT files up to 10 MiB. It requests an upload
ticket through `/files/presign`, then sends the file directly to S3 with the signed
headers. AWS credentials stay in the Python API. Bucket CORS must allow the web
origin; changing `API_BASE_URL` does not configure S3 CORS.

For local testing, enable `ALLOW_LOCAL_UPLOADS` in the SAM dev environment file
as described in the API README. Production signing requires an API Gateway
authorizer and frontend login integration, which are not configured yet. Uploads
appear when you click **Get files**. The response shows object keys, byte sizes,
and modification times; **Load more** fetches another page if needed.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
