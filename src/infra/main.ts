import { App, Aspects, Tags } from "aws-cdk-lib";
import { TagChecker } from "./aspects/TagChecker";
import { AppConfiguration } from "./util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import { MgmtAccountStage } from "./stages/MgmtAccountStage";
import { DevStage } from "./stages/DevStage";
import { ProdStage } from "./stages/ProdStage";

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

new MgmtAccountStage(app, `FastPageMgmtAcctStage`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  mgmtEnv: mgmtEnv,
  targetEnv: targetEnv,
  iamPrincipalAccountNo: mgmtEnv.account,
  apiDomain: mgmtEnv.apiDomain,
});

/* start stuff that needs to be wrapped in env-specific stages */
new DevStage(app, `FastPageDevStage`, {
  env: env,
  appCfg: appCfg,
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

new ProdStage(app, `FastPageProdStage`, {
  env: env,
  appCfg: appCfg,
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

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
