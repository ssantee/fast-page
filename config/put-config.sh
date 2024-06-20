#!/bin/bash

BUCKET_NAME=$1

if [ -z "$BUCKET_NAME" ]; then
  echo "Arg 1 must be the bucket name."
  exit 1
fi

aws s3 cp ./config.json s3://${BUCKET_NAME}/config.json --profile default
aws s3 cp ../src/ui/admin/src/amplifyconfiguration.json s3://${BUCKET_NAME}/amplifyconfiguration.json --profile default
