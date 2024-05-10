import { aws_iam as iam, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Effect, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";

interface IamStackProps extends StackProps {
  mgmtAccount: string;
}

export class IamStack extends Stack {
  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const role = new Role(this, "SSMAccessRole", {
      assumedBy: new iam.AccountPrincipal(props.mgmtAccount),
    });

    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: [
          "ssm:GetParameter",
          "ssm:PutParameter",
          "ssm:DeleteParameter",
          "ssm:AddTagsToResource",
          "ssm:RemoveTagsFromResource",
        ],
        conditions: {
          StringEquals: {
            "ssm:resourceTag/aws:cloudformation:stack-id": `${this.stackId}`,
          },
        },
      }),
    );
  }
}
