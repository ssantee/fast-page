# fast-page

## Overview

Repository to house infrastructure and application code for the fast-page project. 

The project will create infrastructure for a serverless website, including:
- Admin and public-facing S3 sites
- Authentication infra
- Serverless services
- DynamoDB tables
- Multiple environments (dev, prod)
- DNS configurations for all of the above

## Configuration
Examine the directory `/config` for the example configuration file. This file should be customized and renamed to `config.json` before attempting to `cdk synth` or `cdk deploy`.

### Environment Variables
When calling CDK CLI operations, the `DEPLOY_ENV` environment variable should be set to the desired environment. This variable is used to help determine configuration of cross-account DNS and other resources.

Note that the AWS CLI profile should still be set for `cdk synth` or `cdk deploy` operations.

```
export DEPLOY_ENV=dev; cdk synth --profile dev;
```

## DNS
Hosted zone for primary domain lives in the management account. 
Child accounts each have a hosted zone for their subdomain.

First `cdk deploy MgmtAcctDNS` to set up the mgmt account.
Then, `export DEPLOY_ENV=dev; cdk deploy SubDomain --profile dev;`

## CDK
### Construct Ids
Each CDK construct is created with a `constructId` parameter that is used by CDK to uniquely identify the construct.

Changing these construct IDs will cause CDK to create new resources instead of updating the existing resource, and can lead to deployment failures. This should mean that these IDs will rarely, if ever, change. 

To help ensure that construct IDs are unique and discourage their unintentional modification, some stack directories at `src/infra/stacks/*` contains a `constructIds.ts` file that exports the construct IDs for that stack as an enum. 

## Docker
Services in this project are containerized lambdas. The Dockerfile for each service is located in the service's directory. 

On `cdk deploy`, the Dockerfile is built and pushed to ECR. Use this command to log docker into ecr: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AccountNumber>.dkr.ecr.us-east-1.amazonaws.com`

## Cognito
### Testing

After creating test users via console, use this command to set a user's password, removing them from 'Force change password' state:

```bash
aws cognito-idp admin-set-user-password \
--user-pool-id <your-user-pool-id> \
--username <username> \
--password <password> \
--permanent
```
