import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { MgmtAcctDNSRoleStack } from "../../src/infra/stacks/dns/MgmtAcctDNSRoleStack";
import { describe } from "node:test";
import { DomainEnv } from "../../src/shared/types";

describe("MgmtAcctDNSRoleStack test suite", () => {
  let MgmtAcctDNSRoleStackTemplate: Template;
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
      adminDomain: "dev.pgadmin.santee.cloud",
    },
    root: {
      account: "123456789012",
      region: "us-east-1",
      domain: "pg.santee.cloud",
      adminDomain: "dev.pgadmin.santee.cloud",
    },
  };

  beforeAll(() => {
    const app = new cdk.App();
    const mgmtAcctDNSRoleStack = new MgmtAcctDNSRoleStack(
      app,
      "WebPublicStack",
      {
        env: {
          account: envs.prod.account,
          region: "us-east-1",
        },
        mgmtEnv: envs.root,
        targetEnv: envs.prod,
        iamPrincipalAccountNo: envs.prod.account,
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
                    `:iam::${envs.prod.account}:root`,
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
        Name: `${envs.root.domain}.`,
        Type: "NS",
      },
    );
  });

  test("Matches snapshot", () => {
    expect(MgmtAcctDNSRoleStackTemplate).toMatchSnapshot();
  });
});
