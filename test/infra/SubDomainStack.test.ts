import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe } from "node:test";
import { AppConfiguration } from "../../src/infra/util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import { SubDomain } from "../../src/infra/stacks/dns/SubDomain";

describe("SubDomainStack test suite", () => {
  let SubDomainStackTemplate: Template;
  const appCfg = new AppConfiguration(appConfig);
  const targetEnv = appCfg.devEnv;
  const mgmtEnv = appCfg.mgmtEnv;

  beforeAll(() => {
    const app = new cdk.App();
    const subDomainStack = new SubDomain(app, "WebPublicStack", {
      env: {
        account: targetEnv.account,
        region: "us-east-1",
      },
      certificateArnParamName: "/account/fpCertificateArn",
      subdomainHostedZoneIdParamName: "/account/fpSubdomainHostedZoneId",
      mgmtEnvAcctNo: mgmtEnv.account,
      deployEnvDomain: targetEnv.domain,
      mgmtEnvDomain: mgmtEnv.domain,
    });
    SubDomainStackTemplate = Template.fromStack(subDomainStack);
  });

  test("creates cross account zone delegation record", () => {
    SubDomainStackTemplate.hasResourceProperties(
      "Custom::CrossAccountZoneDelegation",
      {
        ParentZoneName: mgmtEnv.domain,
        DelegatedZoneName: targetEnv.domain,
        AssumeRoleArn: {
          "Fn::Join": [
            "",
            [
              "arn:",
              {
                Ref: "AWS::Partition",
              },
              `:iam::${mgmtEnv.account}:role/MyXAcctDelegationRole`,
            ],
          ],
        },
      },
    );
  });

  test("creates hosted zone", () => {
    SubDomainStackTemplate.hasResourceProperties("AWS::Route53::HostedZone", {
      Name: `${targetEnv.domain}.`,
    });
  });

  test("Matches snapshot", () => {
    expect(SubDomainStackTemplate).toMatchSnapshot();
  });
});
