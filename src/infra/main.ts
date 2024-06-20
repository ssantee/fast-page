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
  appCfg: appCfg,
});

const cicdStack = new CICDStack(app, `FPCICDStack`, {
  env: { account: mgmtEnv.account, region: mgmtEnv.region },
  appCfg: appCfg,
});

cicdStack.pipeline.addStage(mgmtStage);

appCfg.deployableEnvs.forEach((env) => {
  let options = {};

  if (env.pipelineRequiresApproval) {
    options = {
      pre: [new pipelines.ManualApprovalStep(`Deploy${env.constructIdPart!}`)],
    };
  }

  cicdStack.pipeline.addStage(
    new DeploymentStage(app, `FP${env.constructIdPart}Stage`, {
      env: { account: env.account, region: env.region },
      appCfg: appCfg,
      assetsDir: assetsDir,
      mgmtEnv: mgmtEnv,
      targetEnv: env,
      constructIdKey: env.constructIdPart!,
    }),
    options,
  );
});

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
