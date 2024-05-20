# fast-page

## Overview

Repository to house infrastructure and application code for the fast-page project. 

The project will create infrastructure for an app, including:
- Public-facing S3 site
- Admin site on ECS
- Authentication infra
- Serverless services
- DynamoDB tables
- Multiple environments (dev, prod)
- DNS configurations for all of the above

## Configuration
Examine the directory `/config` for the example configuration file. This file should be customized and renamed to `config.json` before attempting to `cdk synth` or `cdk deploy`.

Because the configuration file contains sensitive information, it is not checked into source control. It should be stored in a bucket in the management account. The pipeline will download the configuration file from the bucket before deploying the stack. `config.configBucketName` should be set to the name of the bucket where the live configuration file is stored. 

## DNS
Hosted zone for primary domain lives in the management account. 
Child accounts each have a hosted zone for their subdomain.

## CDK

## Docker
Services in this project are containerized lambdas. The Dockerfile for each service is located in the service's directory. 

On `cdk deploy`, the Dockerfile is built and pushed to ECR. Use this command to log docker into ecr: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AccountNumber>.dkr.ecr.us-east-1.amazonaws.com`

The admin site is an ECS service. The dockerfile is located in the `src/ui/admin` directory.

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
