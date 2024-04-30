#!/bin/bash
export DEPLOY_ENV=dev
cdk deploy FastPageMgmtAcctDNSRoleStack --profile default &&
cdk deploy FastPageSubDomainStack --profile $DEPLOY_ENV &&
cdk deploy FastPageAdminSubDomainStack --profile $DEPLOY_ENV &&
cdk deploy FastPageWebPublicStack --profile $DEPLOY_ENV &&
cdk deploy FastPageWebAdminStack --profile $DEPLOY_ENV
