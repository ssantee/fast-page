import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe } from "node:test";
import { DomainEnv } from "../../src/shared/types";
import DataStack from "../../src/infra/stacks/data/DataStack";

describe("DataStack test suite", () => {
  let DataStackTemplate: Template;
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
      adminDomain: "prod.pgadmin.santee.cloud",
      apiDomain: "prod.pgapi.santee.cloud",
    },
    root: {
      account: "123456789012",
      region: "us-east-1",
      domain: "pg.santee.cloud",
      adminDomain: "dev.pgadmin.santee.cloud",
      apiDomain: "pgapi.santee.cloud",
    },
  };

  const paramNameDDBTableName = "/fp/ddbTable";

  beforeAll(() => {
    const app = new cdk.App();
    const ds = new DataStack(app, `FastPageDataStack`, {
      env: { account: envs.prod.account, region: envs.prod.region },
      paramNameDDBTableName: paramNameDDBTableName,
      paramNameDDBTableArn: "/fp/ddbTableArn",
    });
    DataStackTemplate = Template.fromStack(ds);
  });

  test("table has properties", () => {
    DataStackTemplate.hasResource("AWS::DynamoDB::Table", {
      DeletionPolicy: "Retain",
    });
  });

  test("Matches snapshot", () => {
    expect(DataStackTemplate).toMatchSnapshot();
  });
});
