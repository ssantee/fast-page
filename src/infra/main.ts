import { App, Aspects, Tags } from "aws-cdk-lib";
import { TagChecker } from "./aspects/TagChecker";
import { AppConfiguration } from "./util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import { MgmtAccountStage } from "./stages/MgmtAccountStage";
import { DevStage } from "./stages/DevStage";
import { ProdStage } from "./stages/ProdStage";
import { CICDStack } from "./stacks/cicd/CICDStack";

const appName = "fast-page";
const assetsDir = `${process.cwd()}/assets`;

const appCfg = new AppConfiguration(appConfig);
const mgmtEnv = appCfg.mgmtEnv;

const app = new App();

const mgmtDev = new MgmtAccountStage(app, `FastPageMgmtAcctStageDev`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.devEnv,
  iamPrincipalAccountNo: mgmtEnv.account,
  apiDomain: mgmtEnv.apiDomain,
  stackName: `FastPageMgmtAcctDNSRoleStackDev`,
});

const mgmtProd = new MgmtAccountStage(app, `FastPageMgmtAcctStageProd`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.prodEnv,
  iamPrincipalAccountNo: mgmtEnv.account,
  apiDomain: mgmtEnv.apiDomain,
  stackName: `FastPageMgmtAcctDNSRoleStackProd`,
});

const devStage = new DevStage(app, `FastPageDevStage`, {
  env: { account: appCfg.devEnv.account, region: appCfg.devEnv.region },
  appCfg: appCfg,
  assetsDir: assetsDir,
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.devEnv,
  certificateArnParamName: appCfg.paramNames.certificateArn,
  certificateArnParamNameAdmin: appCfg.paramNames.certificateArnAdmin,
  subdomainHostedZoneIdParamName: appCfg.paramNames.subdomainHostedZoneId,
  adminSubdomainHostedZoneIdParamName:
    appCfg.paramNames.adminSubdomainHostedZoneId,
  certificateArnParamNameApi: appCfg.paramNames.certificateArnApi,
  apiSubdomainHostedZoneIdParamName: appCfg.paramNames.apiDomainHostedZoneId,
  apiDomain: mgmtEnv.apiDomain,
});

const prodStage = new ProdStage(app, `FastPageProdStage`, {
  env: { account: appCfg.prodEnv.account, region: appCfg.prodEnv.region },
  appCfg: appCfg,
  assetsDir: assetsDir,
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.prodEnv,
  certificateArnParamName: appCfg.paramNames.certificateArn,
  certificateArnParamNameAdmin: appCfg.paramNames.certificateArnAdmin,
  subdomainHostedZoneIdParamName: appCfg.paramNames.subdomainHostedZoneId,
  adminSubdomainHostedZoneIdParamName:
    appCfg.paramNames.adminSubdomainHostedZoneId,
  certificateArnParamNameApi: appCfg.paramNames.certificateArnApi,
  apiSubdomainHostedZoneIdParamName: appCfg.paramNames.apiDomainHostedZoneId,
  apiDomain: mgmtEnv.apiDomain,
});

const cicdStack = new CICDStack(app, `FastPageCICDStack`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
});

cicdStack.pipeline.addStage(mgmtDev);
cicdStack.pipeline.addStage(mgmtProd);
cicdStack.pipeline.addStage(devStage);
cicdStack.pipeline.addStage(prodStage);

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
