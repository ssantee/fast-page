#!/bin/bash
export DEPLOY_ENV=prod
cdk synth --profile $DEPLOY_ENV
