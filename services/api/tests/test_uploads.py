import json
import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, NoCredentialsError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from main import handler


class UploadTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {"FILES_BUCKET": "test-bucket"}, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.client = Mock()
        self.client.generate_presigned_url.return_value = "https://test-bucket.s3.amazonaws.com/signed"
        self.client_patch = patch("handlers.files.get_s3_client", return_value=self.client)
        self.client_patch.start()
        self.addCleanup(self.client_patch.stop)

    def request(self, body=None, authorizer=None):
        event = {
            "httpMethod": "POST",
            "path": "/files/presign",
            "headers": {"Content-Type": "application/json"},
            "requestContext": {"authorizer": authorizer or {}},
            "body": json.dumps(body if body is not None else {
                "filename": "report.pdf", "contentType": "application/pdf", "sizeBytes": 2048,
            }),
            "isBase64Encoded": False,
        }
        return handler(event, None)

    def test_anonymous_request_does_not_sign(self):
        self.assertEqual(self.request()["statusCode"], 401)
        self.client.generate_presigned_url.assert_not_called()

    def test_local_upload_requires_both_explicit_flag_and_sam(self):
        os.environ["ALLOW_LOCAL_UPLOADS"] = "true"
        self.assertEqual(self.request()["statusCode"], 401)
        os.environ["AWS_SAM_LOCAL"] = "true"
        self.assertEqual(self.request()["statusCode"], 200)

    def test_signing_binds_type_size_expiry_and_unique_server_key(self):
        identity = {"claims": {"sub": "alice"}}
        first = self.request(authorizer=identity)
        second = self.request(authorizer=identity)
        self.assertEqual(first["statusCode"], 200)
        self.assertEqual(first["multiValueHeaders"]["Cache-Control"], ["no-store"])
        first_data = json.loads(first["body"])
        self.assertNotEqual(first_data["key"], json.loads(second["body"])["key"])
        self.assertTrue(first_data["key"].startswith("uploads/"))
        self.assertNotIn("alice", first_data["key"])
        args, kwargs = self.client.generate_presigned_url.call_args
        self.assertEqual(args, ("put_object",))
        self.assertEqual(kwargs["Params"]["Bucket"], "test-bucket")
        self.assertEqual(kwargs["Params"]["ContentLength"], 2048)
        self.assertEqual(kwargs["Params"]["ContentType"], "application/pdf")
        self.assertEqual(kwargs["ExpiresIn"], 300)
        self.assertEqual(kwargs["HttpMethod"], "PUT")

    def test_invalid_requests_never_sign(self):
        valid = {"filename": "report.pdf", "contentType": "application/pdf", "sizeBytes": 2048}
        invalid = [
            {**valid, "sizeBytes": 0},
            {**valid, "sizeBytes": 10485761},
            {**valid, "sizeBytes": "2048"},
            {**valid, "sizeBytes": True},
            {**valid, "contentType": "text/plain"},
            {**valid, "filename": "../report.pdf"},
            {**valid, "filename": "report.exe"},
            {**valid, "userId": "another-user"},
            {**valid, "key": "another-user/report.pdf"},
            [],
        ]
        for body in invalid:
            with self.subTest(body=body):
                self.assertEqual(self.request(body, {"principalId": "alice"})["statusCode"], 400)
        self.client.generate_presigned_url.assert_not_called()

    def test_missing_bucket_and_credentials_have_controlled_errors(self):
        os.environ.pop("FILES_BUCKET")
        self.assertEqual(self.request(authorizer={"principalId": "alice"})["statusCode"], 503)
        os.environ["FILES_BUCKET"] = "test-bucket"
        self.client.generate_presigned_url.side_effect = NoCredentialsError()
        self.assertEqual(self.request(authorizer={"principalId": "alice"})["statusCode"], 503)

    def test_real_sdk_signature_includes_exact_length_and_type(self):
        # Offline signing with dummy credentials; no AWS requests are made.
        client = boto3.client(
            "s3", region_name="us-east-1", aws_access_key_id="test",
            aws_secret_access_key="test", config=Config(signature_version="s3v4"),
        )
        with patch("handlers.files.get_s3_client", return_value=client):
            response = self.request(authorizer={"principalId": "alice"})
        query = parse_qs(urlparse(json.loads(response["body"])["uploadUrl"]).query)
        self.assertEqual(query["X-Amz-SignedHeaders"], ["content-length;content-type;host"])
        self.assertEqual(query["X-Amz-Expires"], ["300"])

    def list_request(self, authorizer=None, query=None):
        return handler({
            "httpMethod": "GET", "path": "/files/", "headers": {},
            "requestContext": {"authorizer": authorizer or {}},
            "queryStringParameters": query, "body": None, "isBase64Encoded": False,
        }, None)

    def test_anonymous_listing_never_contacts_s3(self):
        self.assertEqual(self.list_request()["statusCode"], 401)
        self.client.list_objects_v2.assert_not_called()

    def test_listing_uses_same_owner_prefix_as_upload_and_serializes_metadata(self):
        identity = {"claims": {"sub": "alice"}}
        upload_key = json.loads(self.request(authorizer=identity)["body"])["key"]
        self.client.list_objects_v2.return_value = {"Contents": [{
            "Key": upload_key, "Size": 2048,
            "LastModified": datetime(2026, 10, 11, tzinfo=timezone.utc),
        }], "NextContinuationToken": "next-page"}
        response = self.list_request(identity, {"continuationToken": "current-page", "prefix": "uploads/bob/"})
        self.assertEqual(response["statusCode"], 200)
        self.client.list_objects_v2.assert_called_once_with(
            Bucket="test-bucket", Prefix=upload_key.rsplit("/", 1)[0] + "/",
            MaxKeys=100, ContinuationToken="current-page",
        )
        data = json.loads(response["body"])
        self.assertEqual(data["files"], [{
            "key": upload_key, "sizeBytes": 2048, "lastModified": "2026-10-11T00:00:00+00:00",
        }])
        self.assertEqual(data["nextToken"], "next-page")

    def test_local_listing_handles_empty_bucket(self):
        os.environ.update({"ALLOW_LOCAL_UPLOADS": "true", "AWS_SAM_LOCAL": "true"})
        self.client.list_objects_v2.return_value = {}
        response = self.list_request()
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(json.loads(response["body"]), {"files": [], "nextToken": None})

    def test_listing_reports_storage_failure_instead_of_an_empty_list(self):
        self.client.list_objects_v2.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Denied"}}, "ListObjectsV2",
        )
        self.assertEqual(self.list_request({"principalId": "alice"})["statusCode"], 503)

    def test_listing_rejects_invalid_page_tokens(self):
        self.assertEqual(self.list_request({"principalId": "alice"}, {"continuationToken": ""})["statusCode"], 400)
        self.client.list_objects_v2.assert_not_called()
        self.client.list_objects_v2.side_effect = ClientError(
            {"Error": {"Code": "InvalidArgument"}}, "ListObjectsV2",
        )
        self.assertEqual(self.list_request({"principalId": "alice"}, {"continuationToken": "invalid"})["statusCode"], 400)


if __name__ == "__main__":
    unittest.main()
