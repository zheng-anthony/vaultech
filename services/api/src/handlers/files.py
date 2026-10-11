import hashlib
import json
import os
from functools import lru_cache
from uuid import uuid4

import boto3
from aws_lambda_powertools.event_handler import Response
from aws_lambda_powertools.event_handler.router import APIGatewayRouter
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

router = APIGatewayRouter()

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
UPLOAD_EXPIRY_SECONDS = 300
DOCUMENT_TYPES = {".pdf": "application/pdf", ".txt": "text/plain"}


class UploadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    filename: str = Field(min_length=1, max_length=255)
    contentType: str
    sizeBytes: int = Field(gt=0, le=MAX_UPLOAD_BYTES)

    @model_validator(mode="after")
    def validate_document(self):
        extension = os.path.splitext(self.filename)[1].lower()
        if (
            "/" in self.filename
            or "\\" in self.filename
            or any(ord(char) < 32 for char in self.filename)
            or DOCUMENT_TYPES.get(extension) != self.contentType
        ):
            raise ValueError("Use a PDF or plain-text document with a matching content type.")
        return self


@lru_cache(maxsize=1)
def get_s3_client():
    return boto3.client("s3", config=Config(signature_version="s3v4"))


def error_response(status: int, message: str):
    return Response(
        status_code=status,
        content_type="application/json",
        body=json.dumps({"message": message}),
        headers={"Cache-Control": "no-store"},
    )


def file_subject():
    # Trust only gateway-verified claims, never an identity supplied in JSON/headers.
    authorizer = router.current_event.raw_event.get("requestContext", {}).get("authorizer") or {}
    subject = (authorizer.get("claims") or {}).get("sub") or authorizer.get("principalId")
    if isinstance(subject, str) and subject:
        return subject
    if os.getenv("AWS_SAM_LOCAL") == "true" and os.getenv("ALLOW_LOCAL_UPLOADS") == "true":
        return "local-development"
    return None


def files_prefix(subject: str):
    # Keep listing and signing scoped to the same verified identity.
    owner = hashlib.sha256(subject.encode()).hexdigest()
    return f"uploads/{owner}/"


@router.get("/")
def list_files():
    subject = file_subject()
    if subject is None:
        return error_response(401, "Sign in before listing documents.")

    bucket = os.getenv("FILES_BUCKET")
    if not bucket:
        return error_response(503, "Upload storage is not configured.")

    token = router.current_event.get_query_string_value("continuationToken")
    if token is not None and (not token or len(token) > 4096):
        return error_response(400, "Invalid continuation token.")

    params = {"Bucket": bucket, "Prefix": files_prefix(subject), "MaxKeys": 100}
    if token is not None:
        params["ContinuationToken"] = token

    try:
        result = get_s3_client().list_objects_v2(**params)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") in {"InvalidArgument", "InvalidToken"}:
            return error_response(400, "Invalid continuation token.")
        return error_response(503, "Unable to list documents. Please try again.")
    except BotoCoreError:
        return error_response(503, "Unable to list documents. Please try again.")

    return Response(
        status_code=200,
        content_type="application/json",
        headers={"Cache-Control": "no-store"},
        body=json.dumps({
            "files": [
                {
                    "key": item["Key"],
                    "sizeBytes": item["Size"],
                    "lastModified": item["LastModified"].isoformat(),
                }
                for item in result.get("Contents", [])
            ],
            "nextToken": result.get("NextContinuationToken"),
        }),
    )


@router.post("/presign")
def presign_upload():
    subject = file_subject()
    if subject is None:
        return error_response(401, "Sign in before uploading a document.")

    try:
        request = UploadRequest.model_validate(router.current_event.json_body)
    except (ValidationError, ValueError, TypeError):
        return error_response(400, "Provide a PDF or TXT filename, matching contentType, and sizeBytes between 1 and 10485760.")

    bucket = os.getenv("FILES_BUCKET")
    if not bucket:
        return error_response(503, "Upload storage is not configured.")

    key = f"{files_prefix(subject)}{uuid4()}"
    try:
        url = get_s3_client().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ContentType": request.contentType,
                # Bind the exact declared size. Browsers set this header from the File body.
                "ContentLength": request.sizeBytes,
            },
            ExpiresIn=UPLOAD_EXPIRY_SECONDS,
            HttpMethod="PUT",
        )
    except (BotoCoreError, ClientError):
        return error_response(503, "Unable to prepare an upload. Please try again.")

    return Response(
        status_code=200,
        content_type="application/json",
        headers={"Cache-Control": "no-store"},
        body=json.dumps({
            "uploadUrl": url,
            "key": key,
            "expiresIn": UPLOAD_EXPIRY_SECONDS,
            "requiredHeaders": {"Content-Type": request.contentType},
        }),
    )
