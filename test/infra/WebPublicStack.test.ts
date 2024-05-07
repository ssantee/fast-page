import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { S3CloudfrontSiteStack } from "../../src/infra/stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { describe } from "node:test";
import { AppConfiguration } from "../../src/infra/util/AppConfiguration";
import * as appConfig from "../../config/config.json";

describe("S3CloudfrontSiteStack stack test suite", () => {
  let webPublicTemplate: Template;

  beforeAll(() => {
    const appCfg = new AppConfiguration(appConfig, "prod");
    const targetEnv = appCfg.targetEnv;
    const paramNames = appCfg.paramNames;

    const app = new cdk.App();
    const webPublicStack = new S3CloudfrontSiteStack(app, "WebPublicStack", {
      deployEnv: "prod",
      env: {
        account: targetEnv.account,
        region: targetEnv.region,
      },
      description: "Web Public Stack",
      assetsDir: `${process.cwd()}/assets`,
      certificateArnParamName: paramNames.certificateArn,
      hzIdParamName: paramNames.subdomainHostedZoneId,
      deployEnvDomain: targetEnv.domain,
    });
    webPublicTemplate = Template.fromStack(webPublicStack);
  });

  test("construct produces 3 buckets", () => {
    // app bucket, access logging bucket, cloudfront logging and access logs buckets
    webPublicTemplate.resourceCountIs("AWS::S3::Bucket", 4);
  });

  test("s3 buckets have retention (prod), encryption, no public access", () => {
    webPublicTemplate.allResources("AWS::S3::Bucket", {
      DeletionPolicy: "Retain",
    });

    webPublicTemplate.allResourcesProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: "AES256",
            },
          },
        ],
      },
    });
  });

  test("Matches snapshot", () => {
    expect(webPublicTemplate).toMatchSnapshot();
  });
});
