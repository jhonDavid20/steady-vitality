# Object storage

Media uploads use short-lived, authenticated upload URLs. The browser uploads the file directly to an S3-compatible bucket, while the API validates the MIME type and the 50 MB size limit.

Configure these variables in the API environment:

- `OBJECT_STORAGE_ENDPOINT`
- `OBJECT_STORAGE_REGION` (`auto` for Cloudflare R2)
- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_ACCESS_KEY_ID`
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- `OBJECT_STORAGE_PUBLIC_BASE_URL`

Allow `PUT` requests from the web application origin in the bucket CORS policy. Allow the `Content-Type` header and the MIME types accepted by `mediaUploadInputSchema`. Keep the bucket credentials server-side.
