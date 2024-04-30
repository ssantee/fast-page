/*
 * Store the various IAM action strings used in the project.
 * */
enum ddbPermissions {
  PutItem = "dynamodb:PutItem",
  Scan = "dynamodb:Scan",
  GetItem = "dynamodb:GetItem",
  UpdateItem = "dynamodb:UpdateItem",
  DeleteItem = "dynamodb:DeleteItem",
}

enum s3Permissions {
  PutObject = "s3:PutObject",
  GetObject = "s3:GetObject",
  DeleteObject = "s3:DeleteObject",
  ListObjects = "s3:ListObjects",
}

export { ddbPermissions, s3Permissions };
