import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe } from "node:test";
import { AppConfiguration } from "../../src/infra/util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import DataStack from "../../src/infra/stacks/data/DataStack";

describe("DataStack test suite", () => {
  let DataStackTemplate: Template;

  const appCfg = new AppConfiguration(appConfig, "prod");
  const targetEnv = appCfg.targetEnv;
  const paramNameDDBTableName = "/fp/ddbTable";

  beforeAll(() => {
    const app = new cdk.App();
    const ds = new DataStack(app, `FastPageDataStack`, {
      env: { account: targetEnv.account, region: targetEnv.region },
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
