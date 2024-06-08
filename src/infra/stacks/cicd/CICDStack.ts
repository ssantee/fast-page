import {
  pipelines,
  Stack,
  StackProps,
  aws_codebuild as codebuild,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AppConfiguration } from "../../util/AppConfiguration";

interface CICDStackProps extends StackProps {
  appCfg: AppConfiguration;
}

export class CICDStack extends Stack {
  public pipeline: pipelines.CodePipeline;
  constructor(scope: Construct, id: string, props: CICDStackProps) {
    super(scope, id, props);

    const repo = Repository.fromRepositoryArn(
      this,
      "Repo",
      props.appCfg.repositoryArn,
    );

    this.pipeline = new pipelines.CodePipeline(this, "FPPipeline", {
      crossAccountKeys: true,
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        },
      },
      synth: new pipelines.CodeBuildStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, "master"),
        primaryOutputDirectory: "cdk.out",
        commands: [
          `aws s3 cp s3://${props.appCfg.configBucketName}/config.json ./config`,
          `aws s3 cp s3://${props.appCfg.configBucketName}/amplifyconfiguration.json ./src/ui/admin/src`,
          "npm ci",
          "npm run build",
          "npx cdk synth",
        ],
        rolePolicyStatements: [
          new PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [
              `arn:aws:s3:::${props.appCfg.configBucketName}/config.json`,
              `arn:aws:s3:::${props.appCfg.configBucketName}/amplifyconfiguration.json`,
            ],
            effect: Effect.ALLOW,
          }),
        ],
      }),
    });
  }
}
