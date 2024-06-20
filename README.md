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

On `cdk deploy`, the Dockerfile is built and pushed to ECR in the admin account?. Use this command to log docker into ecr: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AccountNumber>.dkr.ecr.us-east-1.amazonaws.com`

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
synth

`cdk synth --no-staging`
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-getting-started.html

Build image:

`sam build -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json FastPagepageserviceFunctionpageserviceA69CBF46`

Get Creds for Lambda Role:

```aws sts assume-role --role-arn <lambda-role-arn> --role-session-name AWSCLI-Session --profile <profile-name (mgmt account)>```

```aws sts assume-role --role-arn arn:aws:iam::590184120807:role/OrganizationAccountAccessRole --role-session-name AWSCLI-Session --profile default```

Add role creds to local-env.json in project root.

Start Local Lambda(s):
`sam local start-api -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json --container-env-vars ./local-env.json -d 9001`


```bash
sam build -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json FastPagepageserviceFunctionpageserviceA69CBF46

aws sts assume-role --role-arn arn:aws:iam::590184120807:role/OrganizationAccountAccessRole --role-session-name AWSCLI-Session --profile default

sam local start-api -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json --container-env-vars ./local-env.json -d 9001


```

### Warning

The following became an issue with non-unique logical IDs for the lambdas.  

*Issue: When calling SAM CLI like this
```bash
sam local start-lambda -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json 
```

SAM cannot locate one of the functions defined within the same template. It can locate `FastPagecustomerserviceFunctionF98EF4E7` but not `FastPagepageserviceFunction31146B78`. The error message is: `Error: Unable to find a function or layer with name 'FastPagepageserviceFunction31146B78'`.

When one of the functions is manually removed from [cdkoutputstack].template.json, the other function can be located by SAM CLI.

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html
