# fast-page

## Overview

Repository to house infrastructure and application code for the LinkLeveled project. 

The project will create infrastructure for an app, including:
- Public-facing S3 site
- Admin site on ECS
- Authentication infra
- Serverless services
- DynamoDB tables
- Multiple environments (dev, prod)
- DNS configurations for all of the above

## AWS Accounts
This project assumes a multi-account setup. Eg:

- Management Account
  - Development Account
  - Production Account

## Configuration
Examine the directory `/config` for the example configuration file. This file should be customized and renamed to `config.json` before attempting to `cdk synth` or `cdk deploy`.

### configBucketName

Because the configuration file contains sensitive information, it is not checked into source control. It should be stored in a bucket in the management account. `config.configBucketName` should be set to the name of the bucket where the live configuration file is stored. The pipeline will download the configuration file from the bucket before synth/deploy.

The config bucket permissions must allow read access from codebuild.amazonaws.com service principal from the management account.

### environments

The environments section of the configuration file should be customized to match the desired environment names, account numbers, etc.

The app uses SSM parameters to allow access to cdk-generated values between the CDK stacks. The `parameterNames` section of the config allows customization of the names of the SSM parameters.

#### pipelineRequiresApproval

When `true`, the pipeline will pause at the manual approval stage. When `false`, the pipeline will proceed without manual intervention.

## DNS
This project assumes the TLD hosted zone exists in the management account. The TLD and its hosted zone id must be provided in the configuration file, as `tld` and `tldHzId`.

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
## Functions

### Working locally with lambdas
Use SAM CLI for local iteration.
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-getting-started.html

** Must `synth` before `sam build` **

`cdk synth --no-staging` copies the source to cdk.out. `sam build` uses the source in cdk.out to build the docker image. Need to determine where the no-staging arg came from. Doesn't appear to be necessary.

Synth

Synth everything:
`cdk synth --no-staging`

Synth specific stack:
`cdk synth FPDevStage-FPDevFunctionsStack --no-staging`

Build image:
`sam build -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json FastPagepageserviceFunctionpageserviceA69CBF46`

#### Auth/IAM
This requires a role ARN from the dev account, with permissions to be assumed by the management account. The management account profile must have permissions to assume the role in the dev account.
```aws sts assume-role --role-arn <lambda-role-arn (from dev account)> --role-session-name AWSCLI-Session --profile <profile-name (mgmt account)>```

Copy local-env.sample.json, in the project root, and rename to local-env.json. Fill in the assumed role creds.

Alternately, use `./env-refresh.sh <role arn>` to refresh the local-env.json file with the assumed role creds. 

`sam local ...` must be restarted after refreshing the env file.

Start Local Lambda(s):
`sam local start-api -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json --container-env-vars ./local-env.json -d 9001`

#### Complete example
```bash
sam build -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json FastPagepageserviceFunctionpageserviceA69CBF46

aws sts assume-role --role-arn arn:aws:iam::12345678901:role/OrganizationAccountAccessRole --role-session-name AWSCLI-Session --profile default

sam local start-api -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json --container-env-vars ./local-env.json -d 9001


```

### Warning

The following became an issue with cdk-generated logical IDs for the lambdas.  

*Issue: When calling SAM CLI like this
```bash
sam local start-lambda -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json 
```

SAM cannot locate one of the functions defined within the same template. It can locate `FastPagecustomerserviceFunctionF98EF4E7` but not `FastPagepageserviceFunction31146B78`. The error message is: `Error: Unable to find a function or layer with name 'FastPagepageserviceFunction31146B78'`.

When one of the functions is manually removed from [cdkoutputstack].template.json, the other function can be located by SAM CLI.

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html

Resolution: Add unique logical IDs to the functions in the CDK stack. 
