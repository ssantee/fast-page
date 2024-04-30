#!/bin/bash
export DEPLOY_ENV=prod
cdk deploy --all --profile $DEPLOY_ENV
