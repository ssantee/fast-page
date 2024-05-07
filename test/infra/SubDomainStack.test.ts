import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { MgmtAcctDNSRoleStack } from "../../src/infra/stacks/dns/MgmtAcctDNSRoleStack";
import { describe } from "node:test";
import { DomainEnv } from "../../src/shared/types";
import { SubDomain } from "../../src/infra/stacks/dns/SubDomain";

describe("SubDomainStack test suite", () => {
  let SubDomainStackTemplate: Template;
  const envs: { [env: string]: DomainEnv } = {
    dev: {
      account: "123456789012",
      region: "us-east-1",
      domain: "dev.pg.santee.cloud",
      adminDomain: "dev.pgadmin.santee.cloud",
      apiDomain: "dev.pgapi.santee.cloud",
    },
    prod: {
      account: "123456789012",
      region: "us-east-1",
      domain: "prod.pg.santee.cloud",
      adminDomain: "dev.pgadmin.santee.cloud",
      apiDomain: "prod.pgapi.santee.cloud",
    },
    root: {
      account: "123456789012",
      region: "us-east-1",
      domain: "pg.santee.cloud",
      adminDomain: "pgadmin.santee.cloud",
      apiDomain: "pgapi.santee.cloud",
    },
  };

  beforeAll(() => {
    const app = new cdk.App();
    const subDomainStack = new SubDomain(app, "WebPublicStack", {
      env: {
        account: envs.prod.account,
        region: "us-east-1",
      },
      certificateArnParamName: "/account/fpCertificateArn",
      subdomainHostedZoneIdParamName: "/account/fpSubdomainHostedZoneId",
      mgmtEnvAcctNo: envs.root.account,
      deployEnvDomain: envs.prod.domain,
      mgmtEnvDomain: envs.root.domain,
    });
    SubDomainStackTemplate = Template.fromStack(subDomainStack);
  });

  test("creates cross account zone delegation record", () => {
    SubDomainStackTemplate.hasResourceProperties(
      "Custom::CrossAccountZoneDelegation",
      {
        ParentZoneName: envs.root.domain,
        DelegatedZoneName: envs.prod.domain,
        AssumeRoleArn: {
          "Fn::Join": [
            "",
            [
              "arn:",
              {
                Ref: "AWS::Partition",
              },
              `:iam::${envs.root.account}:role/MyXAcctDelegationRole`,
            ],
          ],
        },
      },
    );
  });

  test("creates hosted zone", () => {
    SubDomainStackTemplate.hasResourceProperties("AWS::Route53::HostedZone", {
      Name: `${envs.prod.domain}.`,
    });
  });

  test("Matches snapshot", () => {
    expect(SubDomainStackTemplate).toMatchSnapshot();
  });
});
