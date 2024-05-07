#!/bin/bash
export DEPLOY_ENV=dev
cdk synth FastPageMgmtAcctDNSRoleStack --profile default &&
cdk synth FastPageSubDomainStack --profile $DEPLOY_ENV &&
cdk synth FastPageAdminSubDomainStack --profile $DEPLOY_ENV &&
cdk synth FastPageWebPublicStack --profile $DEPLOY_ENV &&
cdk synth FastPageWebAdminStack --profile $DEPLOY_ENV

