import {
  pipelines,
  Stack,
  StackProps,
  aws_codebuild as codebuild,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

interface CICDStackProps extends StackProps {}

export class CICDStack extends Stack {
  public pipeline: pipelines.CodePipeline;
  constructor(scope: Construct, id: string, props: CICDStackProps) {
    super(scope, id, props);

    const repo = Repository.fromRepositoryArn(
      this,
      "Repo",
      "arn:aws:codecommit:us-east-1:573259953910:fast-page",
    );

    this.pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      crossAccountKeys: true,
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        },
      },
      synth: new pipelines.CodeBuildStep("Synth", {
        // TODO - update branch name
        input: pipelines.CodePipelineSource.codeCommit(repo, "add-pipeline-v2"),
        primaryOutputDirectory: "cdk.out",
        commands: [
          "aws s3 cp s3://ss-config-store/config.json ./config",
          "npm ci",
          "npm run build",
          "npx cdk synth",
        ],
        rolePolicyStatements: [
          new PolicyStatement({
            actions: ["s3:GetObject"],
            resources: ["arn:aws:s3:::ss-config-store/config.json"],
            effect: Effect.ALLOW,
          }),
        ],
      }),
    });
  }
}
