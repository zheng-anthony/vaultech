# Infrastructure environments

`dev/` and `prod/` are independent Terraform deployments. Both use the resource
definitions in `modules/vaultech/`. Each has its own local state, account setting,
and provider lock file. Run Terraform from the environment directory, not `infra/`.

Dev uses `vaultech` names and the `vaultech-files` bucket.
Prod uses `vaultech-prod` names and includes its account ID and region in its
bucket name. Creating these files does not create an AWS account or deploy resources.

Each environment stores its state in its own `terraform.tfstate`, ignored by Git.
Keep the state for existing resources when switching checkouts. Never copy dev state
to prod.

## Configure an environment

Example for dev, from the repository root:

```bash
cp infra/dev/terraform.tfvars.example infra/dev/terraform.tfvars
```

Set `aws_account_id` in that file to the account holding your existing bucket.
For prod, copy and edit the example in `infra/prod/` with your production account ID.
The provider's `allowed_account_ids` check rejects credentials for a different account.

AWS profiles are configured separately on your machine; `dev` and `prod` below are
example profile names, not profiles created by this repository. Use your actual names.

```bash
AWS_PROFILE=dev aws sts get-caller-identity
AWS_PROFILE=dev terraform -chdir=infra/dev init
AWS_PROFILE=dev terraform -chdir=infra/dev plan
```

After reviewing the plan, deploy with:

```bash
AWS_PROFILE=dev terraform -chdir=infra/dev apply
```

For production, use `AWS_PROFILE=prod` and `-chdir=infra/prod` for each command.
Different profiles select credentials; each directory's configuration selects resource
names and state. Keep these state files backed up. Before multiple developers manage
deployments, configure separate remote state locations with locking.

## Lambda build prerequisite

Both environments expect `services/api/function.zip`. Build it before planning:

```bash
cd services/api
sam build --use-container
python3 - <<'PY'
import shutil
shutil.make_archive("function", "zip", ".aws-sam/build/VaultechApi")
PY
```

Docker must be running. The archive contains `src/` and Linux-compatible dependencies.
Terraform supplies the bucket name and Python import path to each deployed Lambda.
The database helper is unused; provisioning a database and configuring its URL are
not part of these deployments yet.

## Upload configuration

The files bucket blocks public access, explicitly uses SSE-S3 encryption, and permits
browser PUT uploads from `upload_allowed_origins`. Dev defaults to
`http://localhost:3000`; configure the actual production frontend origin in prod's
tfvars. CORS does not authenticate requests. Lambda has `s3:PutObject` permission
under `uploads/*` and `s3:ListBucket` constrained to that prefix. The API further
limits listing to the verified user's prefix. Downloads and deletion will need
their own permissions later.

The API Gateway integration explicitly uses payload format 1.0 for the existing
Python REST resolver. No authorizer is configured yet; the signing handler requires
a verified authorizer identity and returns 401 on deployed anonymous requests.
Configure and attach an authorizer, and connect frontend login, before production use.

Review the Terraform plan before applying these bucket settings. If the bucket already
exists outside this environment's state, import it before applying; SAM itself does
not provision storage. The code changes alone do not update AWS resources.

## Read deployment settings

After deployment:

```bash
terraform -chdir=infra/dev output api_url
terraform -chdir=infra/dev output -raw files_bucket_name
```

The API URL selects the deployed backend. The bucket output can be used with local
SAM; see [the API README](../services/api/README.md).
