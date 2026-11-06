---
'@triplef/server': patch
'@triplef/dashboard': patch
'@triplef/agent': patch
---

Move object storage to RustFS and the AWS S3 SDK, use vendor-neutral application and health names, and serve media exclusively from `/api/v1/object-storage`.
