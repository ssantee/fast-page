#!/bin/bash

# This script assumes an AWS IAM role and updates the local-env.json file with
# time-limited credentials allowing that role to perform actions on your account(s).

# Path to your local-env.json
FILE_PATH="local-env.json"

# Check if argument is provided
if [ "$#" -ne 1 ]; then
    echo "This script requires a single argument, the ARN of an IAM role."
    echo "Usage: "
    echo "$0 arn:aws:iam::123456789012:role/OrganizationAccountAccessRole"
    exit 1
fi

roleArn=$1

echo "Authorizing with Role ARN: $1"

# Assuming the role and capturing the response
response=$(aws sts assume-role --role-arn "$roleArn" --role-session-name AWSCLI-Session --profile default)

# Parsing the response to extract credentials
accessKeyId=$(echo $response | jq -r '.Credentials.AccessKeyId')
secretAccessKey=$(echo $response | jq -r '.Credentials.SecretAccessKey')
sessionToken=$(echo $response | jq -r '.Credentials.SessionToken')
expiration=$(echo $response | jq -r '.Credentials.Expiration')

echo "AccessKeyId: $accessKeyId"
echo "SecretAccessKey: $secretAccessKey"
echo "SessionToken: $sessionToken"
echo "Expiration: $expiration"

# Replace the values in the file
# note # is used as a delimiter in sed command as the values contain / which is the default delimiter
sed -i '' "s#\(\"AWS_ACCESS_KEY_ID\": \)\".*\"#\1\"${accessKeyId}\"#" $FILE_PATH
sed -i '' "s#\(\"AWS_SECRET_ACCESS_KEY\": \)\".*\"#\1\"${secretAccessKey}\"#" $FILE_PATH
sed -i '' "s#\(\"AWS_SESSION_TOKEN\": \)\".*\"#\1\"${sessionToken}\"#" $FILE_PATH
sed -i '' "s#\(\"Expiration\": \)\".*\"#\1\"${expiration}\"#" $FILE_PATH

echo 'AWS credentials refreshed'
