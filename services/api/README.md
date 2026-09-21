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

The current response is `{"files": []}`. Rebuild and restart SAM after code changes.

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
after the frontend is implemented to read it; the current starter page makes no API calls.
