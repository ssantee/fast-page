import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { MgmtAcctDNSRoleStack } from "../../src/infra/stacks/dns/MgmtAcctDNSRoleStack";
import { describe } from "node:test";
import { AppConfiguration } from "../../src/infra/util/AppConfiguration";
import * as appConfig from "../../config/config.json";

describe("MgmtAcctDNSRoleStack test suite", () => {
  let MgmtAcctDNSRoleStackTemplate: Template;
  const appCfg = new AppConfiguration(appConfig, "prod");
  const targetEnv = appCfg.targetEnv;
  const mgmtEnv = appCfg.mgmtEnv;

  beforeAll(() => {
    const app = new cdk.App();
    const mgmtAcctDNSRoleStack = new MgmtAcctDNSRoleStack(
      app,
      "WebPublicStack",
      {
        env: {
          account: mgmtEnv.account,
          region: mgmtEnv.region,
        },
        mgmtEnv: mgmtEnv,
        targetEnv: targetEnv,
        iamPrincipalAccountNo: mgmtEnv.account,
        apiDomain: mgmtEnv.apiDomain,
      },
    );
    MgmtAcctDNSRoleStackTemplate = Template.fromStack(mgmtAcctDNSRoleStack);
  });

  test("creates role with correct role props", () => {
    MgmtAcctDNSRoleStackTemplate.hasResourceProperties("AWS::IAM::Role", {
      RoleName: "MyXAcctDelegationRole",
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              AWS: {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      Ref: "AWS::Partition",
                    },
                    `:iam::${targetEnv.account}:root`,
                  ],
                ],
              },
            },
          },
        ],
      },
    });
  });

  test("creates ns record with props", () => {
    MgmtAcctDNSRoleStackTemplate.hasResourceProperties(
      "AWS::Route53::RecordSet",
      {
        Name: `${mgmtEnv.domain}.`,
        Type: "NS",
      },
    );
  });

  test("Matches snapshot", () => {
    expect(MgmtAcctDNSRoleStackTemplate).toMatchSnapshot();
  });
});
