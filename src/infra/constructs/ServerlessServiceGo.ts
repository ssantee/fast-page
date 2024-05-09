import { aws_ssm as ssm, Duration, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
} from "aws-cdk-lib/aws-lambda";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import * as path from "node:path";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";

interface ServerlessServiceGoProps extends StackProps {
  deployEnv: string;
  paramNameDDBTableName: string;
  paramNameDDBTableArn: string;
  serviceName: string;
  userPool: UserPool;
  authorizerId: string;
  restApiId: string;
  rootResourceId: string;
}

export default class ServerlessServiceGo extends Construct {
  lambdaFunction: DockerImageFunction;

  constructor(scope: Construct, id: string, props: ServerlessServiceGoProps) {
    super(scope, id);

    const appTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.paramNameDDBTableName,
    );

    const appTableArn = ssm.StringParameter.valueForStringParameter(
      this,
      props.paramNameDDBTableArn,
    );

    const role = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    );

    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [appTableArn],
        actions: [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
      }),
    );

    const codeAsset = DockerImageCode.fromImageAsset(
      path.join(__dirname, "..", "..", "services", props.serviceName),
      {
        platform: Platform.LINUX_ARM64,
      },
    );

    this.lambdaFunction = new DockerImageFunction(this, "Function", {
      code: codeAsset,
      architecture: Architecture.ARM_64,
      role: role,
      description: "FP API Function",
      timeout: Duration.seconds(30),
      environment: {
        DEPLOY_ENV: props.deployEnv,
        TABLE_NAME: appTableName,
      },
    });
  }
}
