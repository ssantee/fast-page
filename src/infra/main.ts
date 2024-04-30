import { App, Aspects, Tags } from "aws-cdk-lib";
import { TagChecker } from "./aspects/TagChecker";
import { DomainEnv } from "../shared/types";
import { S3CloudfrontSiteStack } from "./stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { DNSStage } from "./stages/DNSStage";
import { MgmtAcctDNSRoleStack } from "./stacks/dns/MgmtAcctDNSRoleStack";

const appName = "fast-page";
const assetsDir = `${process.cwd()}/assets`;
const deployEnv = process.env.DEPLOY_ENV;

if (!deployEnv) {
  throw new Error("Missing DEPLOY_ENV environment variable");
}

const app = new App();
const envs: { [env: string]: DomainEnv } =
  app.node.tryGetContext("environments");
const targetEnv = deployEnv === "dev" ? envs.dev : envs.prod;
const env = { account: targetEnv?.account, region: targetEnv?.region };

const certificateArnParamName = "/fp/CertificateArn";
const certificateArnParamNameAdmin = "/fp/adminCertificateArn";
const subdomainHostedZoneIdParamName = "/fp/subdomainHostedZoneId";
const adminSubdomainHostedZoneIdParamName = "/fp/adminSubdomainHostedZoneId";

new MgmtAcctDNSRoleStack(app, `FastPageMgmtAcctDNSRoleStack`, {
  env: { account: envs.root.account, region: envs.root.region },
  description: "Cross-account delegation role for Fast Page subdomains.",
  mgmtEnv: envs.root,
  targetEnv: targetEnv,
  iamPrincipalAccountNo: envs.root.account,
});

new DNSStage(app, `FastPageDNSStage`, {
  env: env,
  deployEnv: deployEnv,
  assetsDir: assetsDir,
  mgmtEnv: envs.root,
  targetEnv: targetEnv,
  certificateArnParamName: certificateArnParamName,
  certificateArnParamNameAdmin: certificateArnParamNameAdmin,
  subdomainHostedZoneIdParamName: subdomainHostedZoneIdParamName,
  adminSubdomainHostedZoneIdParamName: adminSubdomainHostedZoneIdParamName,
});

new S3CloudfrontSiteStack(app, `FastPageWebPublicStack`, {
  deployEnv: deployEnv,
  env: env,
  description: "Web Public Stack",
  assetsDir: assetsDir,
  certificateArnParamName: certificateArnParamName,
  hzIdParamName: subdomainHostedZoneIdParamName,
  deployEnvDomain: targetEnv.domain,
});

new S3CloudfrontSiteStack(app, `FastPageWebAdminStack`, {
  deployEnv: deployEnv,
  env: env,
  description: "Web Admin Stack",
  assetsDir: assetsDir,
  certificateArnParamName: certificateArnParamNameAdmin,
  hzIdParamName: adminSubdomainHostedZoneIdParamName,
  deployEnvDomain: targetEnv.adminDomain,
});

Tags.of(app).add("app", appName);

Aspects.of(app).add(new TagChecker("app", appName));

app.synth();
