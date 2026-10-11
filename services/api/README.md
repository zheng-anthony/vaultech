# Local API development

SAM runs the Python Lambda locally in Docker. AWS calls from that code use the
AWS profile and bucket configuration you supply. SAM does not create the bucket.

From this directory, with Docker running:

```bash
cp env.dev.json.example env.dev.json
sam build --use-container
sam local start-api --port 3001 --profile dev --env-vars env.dev.json
```

`dev` must be an AWS profile you have configured; substitute its actual name.
The dev example points to the existing `vaultech-files` bucket. `DATABASE_URL`
is blank because the current files endpoint does not use a database.

In another terminal:

```bash
curl http://127.0.0.1:3001/files/
```

This lists documents uploaded under the current identity's S3 prefix. Rebuild and
restart SAM after code changes.

## Environment files

`env.dev.json` and `env.prod.json` are local SAM configuration files, ignored by Git.
Their `.example` templates are tracked. SAM selects the file explicitly through
`--env-vars`; there is no automatic dev/prod switch. Neither file contains AWS credentials.

To run local code against production resources, copy `env.prod.json.example` to
`env.prod.json`, replace its bucket placeholder with
`terraform -chdir=../../infra/prod output -raw files_bucket_name`, and run:

```bash
sam local start-api --port 3001 --profile prod --env-vars env.prod.json
```

This still executes code on your laptop, but storage operations affect real production
data. To use the deployed production Lambda, call its API URL instead.

Names such as `.env.dev` and `.env.prod` are also possible when a tool or application
is explicitly configured to load them. This API currently has no dotenv loader;
the existing `services/.env` is not automatically read by the Python code.
The JSON examples make the SAM selection explicit.

For the Next.js frontend, conventional filenames are `.env.development.local` for
`pnpm dev` and `.env.production.local` for production builds/runs. Those select
Next.js configuration, not AWS accounts. An API URL setting only affects requests
through the frontend's `API_BASE_URL` rewrites.

## Document uploads

`POST /files/presign` accepts `{ "filename": "report.pdf", "contentType": "application/pdf", "sizeBytes": 2048 }`.
Only PDF and TXT documents from 1 byte to 10 MiB are accepted. The response contains
`uploadUrl`, `key`, `expiresIn` (300 seconds), and `requiredHeaders`. Send the original
file as the body of a direct `PUT` to that URL with the returned headers. The exact
Content-Length and Content-Type are signed; the browser sets Content-Length from the
File body automatically. Do not set it manually or wrap the file in FormData.

Signing requires an API Gateway authorizer's verified `claims.sub` or `principalId`.
There is currently no authorizer/login configured, so deployed signing requests return
401 until that integration is implemented. A client-provided user ID is rejected.
For local development only, the dev SAM example sets `ALLOW_LOCAL_UPLOADS=true`;
the bypass also requires SAM's `AWS_SAM_LOCAL=true`. Existing `env.dev.json` files
need that setting added explicitly. Never use the bypass for production resources.

The local AWS profile needs `s3:PutObject` on the bucket's `uploads/*` prefix and
`s3:ListBucket` on the bucket with that prefix permitted. SAM
does not create the bucket or its CORS rules: review and apply the dev Terraform
configuration separately, using the appropriate AWS profile. The frontend origin
must match `upload_allowed_origins` exactly (default: `http://localhost:3000`).

The endpoint validates declared metadata, not file contents. File inspection, quotas,
metadata persistence, upload confirmation, and downloads remain future work. Uploads
are listed by `GET /files/`. Presigned URLs can
be reused until expiry; treat them as temporary credentials and do not log them.

`GET /files/` returns `{ "files": [{ "key": "uploads/...", "sizeBytes": 2048,
"lastModified": "2026-10-11T00:00:00+00:00" }], "nextToken": null }`. It requires
the same identity as signing, returns up to 100 objects per request, and accepts
`?continuationToken=...` for subsequent pages. The server always chooses the owner
prefix; clients cannot select another user's files. Local SAM uploads share the
`local-development` identity. Existing uploads appear by their generated keys;
original filenames were not stored. An empty list means no objects in that prefix;
storage/permission errors return 503.

Run the API's offline tests from this directory:

```bash
.venv/bin/python -m unittest discover -s tests -v
```
