import { App, Aspects, Tags } from "aws-cdk-lib";
import { TagChecker } from "./aspects/TagChecker";
import { AppConfiguration } from "./util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import { S3CloudfrontSiteStack } from "./stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { DNSStage } from "./stages/DNSStage";
import { MgmtAcctDNSRoleStack } from "./stacks/dns/MgmtAcctDNSRoleStack";
import DataStack from "./stacks/data/DataStack";
import FunctionsStack from "./stacks/functions/FunctionsStack";
import { Auth } from "./stacks/auth/Auth";

const appName = "fast-page";
const assetsDir = `${process.cwd()}/assets`;

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

if (!process.env.DEPLOY_ENV) {
  throw new Error(
    "DEPLOY_ENV must be set before calling CDK CLI operations. e.g.:\n\n export DEPLOY_ENV=dev;cdk synth MyStack\n\n",
  );
}

const deployEnv = process.env.DEPLOY_ENV;
const appCfg = new AppConfiguration(appConfig, deployEnv);
const targetEnv = appCfg.targetEnv;
const mgmtEnv = appCfg.mgmtEnv;

const app = new App();

new MgmtAcctDNSRoleStack(app, `FastPageMgmtAcctDNSRoleStack`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  description: "Cross-account delegation role for Fast Page subdomains.",
  mgmtEnv: mgmtEnv,
  targetEnv: targetEnv,
  iamPrincipalAccountNo: mgmtEnv.account,
  apiDomain: mgmtEnv.apiDomain,
});

new DNSStage(app, `FastPageDNSStage`, {
  env: env,
  assetsDir: assetsDir,
  mgmtEnv: mgmtEnv,
  targetEnv: targetEnv,
  certificateArnParamName: appCfg.paramNames.certificateArn,
  certificateArnParamNameAdmin: appCfg.paramNames.certificateArnAdmin,
  subdomainHostedZoneIdParamName: appCfg.paramNames.subdomainHostedZoneId,
  adminSubdomainHostedZoneIdParamName:
    appCfg.paramNames.adminSubdomainHostedZoneId,
  certificateArnParamNameApi: appCfg.paramNames.certificateArnApi,
  apiSubdomainHostedZoneIdParamName: appCfg.paramNames.apiDomainHostedZoneId,
  apiDomain: mgmtEnv.apiDomain,
});

new S3CloudfrontSiteStack(app, `FastPageWebPublicStack`, {
  deployEnv: targetEnv.name,
  env: env,
  description: "Web Public Stack",
  assetsDir: assetsDir,
  certificateArnParamName: appCfg.paramNames.certificateArn,
  hzIdParamName: appCfg.paramNames.subdomainHostedZoneId,
  deployEnvDomain: targetEnv.domain,
});

new S3CloudfrontSiteStack(app, `FastPageWebAdminStack`, {
  deployEnv: targetEnv.name,
  env: env,
  description: "Web Admin Stack",
  assetsDir: assetsDir,
  certificateArnParamName: appCfg.paramNames.certificateArnAdmin,
  hzIdParamName: appCfg.paramNames.adminSubdomainHostedZoneId,
  deployEnvDomain: targetEnv.adminDomain,
});

const auth = new Auth(app, `FastPageAuthStack`, {
  env: env,
  adminGroupName: "FastPageAdmins",
});

new DataStack(app, `FastPageDataStack`, {
  env: env,
  paramNameDDBTableName: appCfg.paramNames.ddbTableName,
  paramNameDDBTableArn: appCfg.paramNames.ddbTableArn,
});

const serviceList = ["page-service", "customer-service"];

new FunctionsStack(app, `FastPageFunctionsStack`, {
  env: env,
  deployEnv: targetEnv.name,
  paramNameDDBTableName: appCfg.paramNames.ddbTableName,
  paramNameDDBTableArn: appCfg.paramNames.ddbTableArn,
  serviceList: serviceList,
  userPool: auth.userPool,
  apiDomain: targetEnv.apiDomain,
  certificateArnParamName: appCfg.paramNames.certificateArnApi,
  hzIdParamName: appCfg.paramNames.apiDomainHostedZoneId,
});

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
