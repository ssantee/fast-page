# LinkLeveled

# Overview

This repository houses infrastructure and application code for the LinkLeveled project.

LinkLeveled is a project-in-progress that will provide a platform for users to create and share lists of links. 

## Components

![Project Components](./docs/LinkLeveled.png "Project Components")

CDK IAC can be found in `src/infra` 

The services live in `src/services`

The admin site lives in `src/ui/admin`

Find a detailed chart illustrating the entire CDK project structure [here](./docs/cdk-dia-all.png). This chart was generated with [cdk-dia](https://github.com/pistazie/cdk-dia).

# CDK
Prerequisites for working with CDK can be found in the [AWS docs](https://docs.aws.amazon.com/cdk/v2/guide/home.html).

Other useful resources:
- [CDK Workshop](https://cdkworkshop.com/)
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [CDK Examples](https://github.com/aws-samples/aws-cdk-examples)

# AWS Accounts
This project assumes a multi-account setup. Eg:

- Management Account
  - Development Account
  - Production Account

# Configuration
Examine the directory `/config` for the example configuration file. This file should be customized and renamed to `config.json` before attempting to `cdk synth` or `cdk deploy`.

Note that the configuration in `/config` does not have separate dev/stage/prod versions. Config for each deployment target lives in the same file. Also note that there are other configuration files located throughout the project. This configuration applies to CDK-managed infrastructure.

## configBucketName
Because the configuration file contains sensitive information, it is not checked into source control. It should be stored in a bucket in the management account. `config.configBucketName` should be set to the name of the bucket where the live configuration file is stored. The pipeline will download the configuration file from the bucket before synth/deploy.

The config bucket's permissions must allow read access from codebuild.amazonaws.com service principal from the management account.

## environments
The environments section of the configuration file should be customized to match the desired environment names, account numbers, etc.

The app uses SSM parameters to allow access to cdk-generated values between the CDK stacks. The `parameterNames` section of the config allows customization of the names of the SSM parameters. 

## pipelineRequiresApproval
When `true`, the pipeline will pause at the manual approval stage. When `false`, the pipeline will proceed without manual intervention.

## DNS
The project allows for the creation of an application URL structure that includes a subdomain for each of the app, API, and admin site, then a second level of subdomains for each environment.

It's assumed that the TLD hosted zone exists in the management account, and is **not managed by CDK**. The TLD and its hosted zone id must be provided in the configuration file, as `tld` and `tldHzId`. All other hosted zones are created and managed by CDK.

The TLD hosted zone is modified during deploy to add NS records pointing subdomain traffic to another hosted zone (in the management account) for each first level subdomain, ie api.example.com or admin.example.com.

Hosted zones are created for each subdomain and given NS entries that point to nameservers in another tier of hosted zone living in the child accounts.

Finally, the child account hosted zones point traffic to the actual resources in the child account; cloudfront for the public site, an ELB for the admin site, and API Gateway for the API.

Explanation of the config options

| Config Key             | Description                          |
|------------------------|--------------------------------------|
| Environments[x].domain | Subdomain for the public-facing site |
| Environments[x].admin  | Subdomain for the admin site         |
| Environments[x].api    | Subdomain for the API                |


The resulting application URLs are structured like this:

Given TLD `example.com` and desired app subdomain `app.example.com`:

| Env/Account | Function | URL                       |
|-------------|----------|---------------------------|
| Dev         | Site     | dev.app.example.com       |
| Dev         | Admin    | dev.appadmin.example.com  |
| Dev         | API      | dev.appapi.example.com    |
| Prod        | Site     | prod.app.example.com      |
| Prod        | Admin    | prod.appadmin.example.com |
| Prod        | API      | prod.appapi.example.com   |

# Docker
Services in this project are containerized lambdas. Source can be found at `src/services`. The Dockerfile for each service is located in the service's directory. 

When working locally: On `cdk deploy`, the Dockerfile is built and the image pushed to ECR. Use this command to log docker into ecr before attempting to deploy: 

```Bash 
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNTNUMBER.dkr.ecr.us-east-1.amazonaws.com
```

The admin site is an ECS service. The dockerfile is located in the `src/ui/admin` directory.

# Functions

## Working locally with lambdas
Use SAM CLI for local iteration.

Review the AWS docs for prerequisites and setup:

- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html

- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-getting-started.html

A truncated overview of the process:

First, `synth` the stack or entire project. Then, `sam build` the lambda. Next, get temporary credentials to allow localhost to talk to DynamoDB, and place those into `local-env.json`. Finally, `sam local start-api` to start the lambda locally.

The following sections elaborate on each step. Read the entire section on Synth/Build and Auth/IAM before attempting to work locally.

## Synth & Build

`cdk synth` copies the services' source to cdk.out. `sam build` uses the source in cdk.out to build the docker image.

** Must `cdk synth` before `sam build` or you will be building the revision previously copied by synth **

### Synth 

Synth everything:
`cdk synth`

Or, synth specific stack:
`cdk synth FPDevStage-FPDevFunctionsStack`

[Further reading](https://docs.aws.amazon.com/cdk/v2/guide/configure-synth.html) on the synth operation and its options.

### Build image
```Bash 
sam build FastPagepageserviceFunctionpageserviceA69CBF46 \
-t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json 
```
Once the image has been built, it can be started locally with `sam local start-api`. This will attempt to start all services defined in `src/infra/stacks/functions/FunctionsStack.ts` (they comprise the resources of an API Gateway Rest API). 

## Auth/IAM
To allow the local lambda emulator server to talk to DynamoDB, temporary credentials must be obtained.

This requires a role ARN from the dev account that has permissions to be assumed by the management account. Put another way, the management account profile must have permissions to assume the role in the dev account.

Sample command to assume the role:

```Bash
aws sts assume-role \
--role-arn ROLEARNFROMDEVACCOUNT \
--role-session-name AWSCLI-Session \
--profile MGMTACCOUTPROFILE
```

---

__Note__ that `--profile` should be the name of the profile in your `~/.aws/credentials` file that exists in the management account and has the necessary permissions to assume the role in the dev account. See [AWS Documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) for more information.

---
Copy local-env.sample.json, in the project root, and rename to local-env.json. Fill in the assumed role creds.

Alternately, use `./env-refresh.sh MYROLEARN` to refresh the local-env.json file with the assumed role credentials. 

`sam local ...` must be restarted after refreshing the env file.

Start Local Lambda(s):

```Bash
sam local start-api \
-t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json \
-d 9001 \
--container-env-vars ./local-env.json
```

#### Complete example
Build
```Bash
sam build FastPagepageserviceFunctionpageserviceA69CBF46 \
-t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json
```
Assume role
```Bash
aws sts assume-role \
--role-arn arn:aws:iam::12345678901:role/OrganizationAccountAccessRole \
--role-session-name AWSCLI-Session \
--profile default
```
Start local lambda emulator
```Bash
sam local start-api \
-t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json \
-d 9001 \
--container-env-vars ./local-env.json
```

## Working with deployed lambdas

The deployed lambdas include Cognito authorization; only authenticated users from the app's Cognito user pool can make requests. 

Outline the process of obtaining an Authorization token to make requests through API Gateway via HTTP/REST client.

Use the following CLI command to obtain a token. Replace the USERNAME, PASSWORD, and USERPOOLWEBCLIENTID with the appropriate values.

```bash
aws cognito-idp initiate-auth \
--auth-flow USER_PASSWORD_AUTH \
--auth-parameters USERNAME=user@some.com,PASSWORD=12345 \
--client-id USERPOOLWEBCLIENTID \
--query 'AuthenticationResult.IdToken' \
--output text > id_token.txt
```

Take the `IdToken` from the response and use it as the value of the Authorization header in the request to the API Gateway.

Helpful Links:
 - https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/#cli-aws-cognito-idp
 - https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html
 - https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html
 
## Cognito
### Testing

If creating test users via console, use this command to set a user's password, removing them from 'Force change password' state:

```bash
aws cognito-idp admin-set-user-password \
--user-pool-id <your-user-pool-id> \
--username <username> \
--password <password> \
--permanent
```

TODO - include command to create user via CLI

https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/admin-create-user.html

# Pipeline

TODO

# Notes

The following became an issue with cdk-generated logical IDs for the lambdas.  

*Issue: When calling SAM CLI like this
```bash
sam local start-lambda -t ./cdk.out/assembly-FPDevStage/FPDevStageFPDevFunctionsStack1DC8F43E.template.json 
```

SAM cannot locate one of the functions defined within the same template. It can locate `FastPagecustomerserviceFunctionF98EF4E7` but not `FastPagepageserviceFunction31146B78`. The error message is: `Error: Unable to find a function or layer with name 'FastPagepageserviceFunction31146B78'`.

When one of the functions is manually removed from _stack_.template.json, the other function can be located by SAM CLI.

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-testing.html

Resolution: Add unique logical IDs to the functions in the CDK stack. 
