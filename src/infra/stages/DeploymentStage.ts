import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppConfiguration, EnvConfig } from "../util/AppConfiguration";
import { S3CloudfrontSiteStack } from "../stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { Auth } from "../stacks/auth/Auth";
import DataStack from "../stacks/data/DataStack";
import FunctionsStack from "../stacks/functions/FunctionsStack";
import { SubDomain } from "../stacks/dns/SubDomain";

export interface DeploymentStageProps extends StageProps {
  assetsDir: string;
  mgmtEnv: EnvConfig;
  targetEnv: EnvConfig;
  apiDomain: string;
  appCfg: AppConfiguration;
  constructIdKey: string;
}

export class DeploymentStage extends Stage {
  constructor(scope: Construct, id: string, props: DeploymentStageProps) {
    super(scope, id, props);

    const sub = new SubDomain(this, `FP${props.constructIdKey}SubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.appCfg.paramNames.certificateArn,
      subdomainHostedZoneIdParamName:
        props.appCfg.paramNames.subdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.domain,
      mgmtEnvDomain: props.mgmtEnv.domain,
    });

    const subAdmin = new SubDomain(
      this,
      `FP${props.constructIdKey}AdminSubDomainStack`,
      {
        env: props.env,
        mgmtEnvAcctNo: props.mgmtEnv.account,
        description:
          "Hosted zones for Fast Page subdomains with cross-account delegation.",
        certificateArnParamName: props.appCfg.paramNames.certificateArnAdmin,
        subdomainHostedZoneIdParamName:
          props.appCfg.paramNames.adminSubdomainHostedZoneId,
        deployEnvDomain: props.targetEnv.adminDomain,
        mgmtEnvDomain: props.mgmtEnv.adminDomain,
      },
    );

    const subApi = new SubDomain(
      this,
      `FP${props.constructIdKey}ApiSubDomainStack`,
      {
        env: props.env,
        mgmtEnvAcctNo: props.mgmtEnv.account,
        description:
          "Hosted zones for Fast Page subdomains with cross-account delegation.",
        certificateArnParamName: props.appCfg.paramNames.certificateArnApi,
        subdomainHostedZoneIdParamName:
          props.appCfg.paramNames.apiDomainHostedZoneId,
        deployEnvDomain: props.targetEnv.apiDomain,
        mgmtEnvDomain: props.mgmtEnv.apiDomain,
      },
    );

    new S3CloudfrontSiteStack(this, `FP${props.constructIdKey}WebPublicStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Public Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArn,
      hzIdParamName: props.appCfg.paramNames.subdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.domain,
    }).addDependency(sub);

    new S3CloudfrontSiteStack(this, `FP${props.constructIdKey}WebAdminStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Admin Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArnAdmin,
      hzIdParamName: props.appCfg.paramNames.adminSubdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.adminDomain,
    }).addDependency(subAdmin);

    const auth = new Auth(this, `FP${props.constructIdKey}AuthStack`, {
      env: props.env,
      adminGroupName: "FastPageAdmins",
    });

    new DataStack(this, `FP${props.constructIdKey}DataStack`, {
      env: props.env,
      paramNameDDBTableName: props.appCfg.paramNames.ddbTableName,
      paramNameDDBTableArn: props.appCfg.paramNames.ddbTableArn,
    });

    const serviceList = ["page-service", "customer-service"];

    new FunctionsStack(this, `FP${props.constructIdKey}FunctionsStack`, {
      env: props.env,
      deployEnv: props.targetEnv.name,
      paramNameDDBTableName: props.appCfg.paramNames.ddbTableName,
      paramNameDDBTableArn: props.appCfg.paramNames.ddbTableArn,
      serviceList: serviceList,
      userPool: auth.userPool,
      apiDomain: props.targetEnv.apiDomain,
      certificateArnParamName: props.appCfg.paramNames.certificateArnApi,
      hzIdParamName: props.appCfg.paramNames.apiDomainHostedZoneId,
    }).addDependency(subApi);
  }
}
