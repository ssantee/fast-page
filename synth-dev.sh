#!/bin/bash
export DEPLOY_ENV=dev
cdk synth --profile $DEPLOY_ENV
