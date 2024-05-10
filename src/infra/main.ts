import { App, Aspects, pipelines, Tags } from "aws-cdk-lib";
import { TagChecker } from "./aspects/TagChecker";
import { AppConfiguration } from "./util/AppConfiguration";
import * as appConfig from "../../config/config.json";
import { MgmtAccountStage } from "./stages/MgmtAccountStage";
import { DeploymentStage } from "./stages/DeploymentStage";
import { CICDStack } from "./stacks/cicd/CICDStack";

const appName = "fast-page";
const assetsDir = `${process.cwd()}/assets`;

const appCfg = new AppConfiguration(appConfig);
const mgmtEnv = appCfg.mgmtEnv;

const app = new App();

const mgmtStage = new MgmtAccountStage(app, `FPMgmtAcctStage`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  mgmtEnv: mgmtEnv,
  devEnv: appCfg.devEnv,
  prodEnv: appCfg.prodEnv,
  iamPrincipalAccountNo: mgmtEnv.account,
  apiDomain: mgmtEnv.apiDomain,
});

const devStage = new DeploymentStage(app, `FPDevStage`, {
  env: { account: appCfg.devEnv.account, region: appCfg.devEnv.region },
  appCfg: appCfg,
  assetsDir: assetsDir,
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.devEnv,
  apiDomain: mgmtEnv.apiDomain,
  constructIdKey: "Dev",
});

const prodStage = new DeploymentStage(app, `FPProdStage`, {
  env: { account: appCfg.prodEnv.account, region: appCfg.prodEnv.region },
  appCfg: appCfg,
  assetsDir: assetsDir,
  mgmtEnv: mgmtEnv,
  targetEnv: appCfg.prodEnv,
  apiDomain: mgmtEnv.apiDomain,
  constructIdKey: "Prod",
});

const cicdStack = new CICDStack(app, `FPCICDStack`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  appCfg: appCfg,
});

cicdStack.pipeline.addStage(mgmtStage);
cicdStack.pipeline.addStage(devStage);
cicdStack.pipeline.addStage(prodStage, {
  pre: [new pipelines.ManualApprovalStep("DeployProd")],
});

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
