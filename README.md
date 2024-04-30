# fast-page

Repository to house infrastructure and application code for the fast-page project.

## Overview

## DNS
Hosted zone for primary domain lives in the management account. 
Child accounts each have a hosted zone for their subdomain.

First `cdk deploy MgmtAcctDNS` to set up the mgmt account.
Then, `export DEPLOY_ENV=dev; cdk deploy SubDomain --profile dev;`

## CDK
### Construct Ids
Each CDK construct is created with a `constructId` parameter that is used by CDK to uniquely identify the construct.

Changing these construct IDs will cause CDK to create new resources instead of updating the existing resource, and can lead to deployment failures. This should mean that these IDs will rarely, if ever, change. 

To help ensure that construct IDs are unique and discourage their unintentional modification, each stack directory at `src/infra/stacks/*` contains a `constructIds.ts` file that exports the construct IDs for that stack as an enum. 
