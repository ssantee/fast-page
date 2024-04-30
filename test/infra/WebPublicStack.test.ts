import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { S3CloudfrontSiteStack } from "../../src/infra/stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { describe } from "node:test";
import { DomainEnv } from "../../src/shared/types";

describe("S3CloudfrontSiteStack stack test suite", () => {
  let webPublicTemplate: Template;

  beforeAll(() => {
    const envs: { [env: string]: DomainEnv } = {
      dev: {
        account: "123456789012",
        region: "us-east-1",
        domain: "dev.pg.santee.cloud",
        adminDomain: "dev.pgadmin.santee.cloud",
      },
      prod: {
        account: "123456789012",
        region: "us-east-1",
        domain: "prod.pg.santee.cloud",
        adminDomain: "prod.pgadmin.santee.cloud",
      },
      root: {
        account: "123456789012",
        region: "us-east-1",
        domain: "pg.santee.cloud",
        adminDomain: "pgadmin.santee.cloud",
      },
    };

    const app = new cdk.App();
    const webPublicStack = new S3CloudfrontSiteStack(app, "WebPublicStack", {
      deployEnv: "prod",
      env: {
        account: "123456789012",
        region: "us-east-1",
      },
      description: "Web Public Stack",
      assetsDir: `${process.cwd()}/assets`,
      certificateArnParamName: "/account/fpCertificateArn",
      hzIdParamName: "/account/fpSubdomainHostedZoneId",
      deployEnvDomain: envs.prod.domain,
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
