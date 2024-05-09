import { aws_iam as iam, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

interface IamStackProps extends StackProps {
  mgmtAccount: string;
}

export class IamStack extends Stack {
  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const role = new Role(this, "SSMAccessRole", {
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
    });

    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["ssm:*"],
        actions: [
          "ssm:GetParameter",
          "ssm:PutParameter",
          "ssm:DeleteParameter",
          "ssm:AddTagsToResource",
          "ssm:RemoveTagsFromResource",
        ],
        conditions: {
          StringEquals: {
            "ssm:resourceTag/managedBy": "aws:cdk",
          },
        },
      }),
    );

    role.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        principals: [new iam.AccountPrincipal(props.mgmtAccount)],
      }),
    );
  }
}
