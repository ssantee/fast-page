import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppConfiguration, EnvConfig } from "../util/AppConfiguration";
import { S3CloudfrontSiteStack } from "../stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { Auth } from "../stacks/auth/Auth";
import DataStack from "../stacks/data/DataStack";
import FunctionsStack from "../stacks/functions/FunctionsStack";
import { SubDomain } from "../stacks/dns/SubDomain";

export interface ProdStageProps extends StageProps {
  assetsDir: string;
  mgmtEnv: EnvConfig;
  targetEnv: EnvConfig;
  certificateArnParamName: string;
  certificateArnParamNameAdmin: string;
  subdomainHostedZoneIdParamName: string;
  adminSubdomainHostedZoneIdParamName: string;
  certificateArnParamNameApi: string;
  apiSubdomainHostedZoneIdParamName: string;
  apiDomain: string;
  appCfg: AppConfiguration;
}

export class ProdStage extends Stage {
  constructor(scope: Construct, id: string, props: ProdStageProps) {
    super(scope, id, props);

    new SubDomain(scope, `FastPageSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamName,
      subdomainHostedZoneIdParamName: props.subdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.domain,
      mgmtEnvDomain: props.mgmtEnv.domain,
    });

    new SubDomain(scope, `FastPageAdminSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamNameAdmin,
      subdomainHostedZoneIdParamName: props.adminSubdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.adminDomain,
      mgmtEnvDomain: props.mgmtEnv.adminDomain,
    });

    new SubDomain(scope, `FastPageApiSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamNameApi,
      subdomainHostedZoneIdParamName: props.apiSubdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.apiDomain,
      mgmtEnvDomain: props.mgmtEnv.apiDomain,
    });

    new S3CloudfrontSiteStack(scope, `FastPageWebPublicStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Public Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArn,
      hzIdParamName: props.appCfg.paramNames.subdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.domain,
    });

    new S3CloudfrontSiteStack(scope, `FastPageWebAdminStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Admin Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArnAdmin,
      hzIdParamName: props.appCfg.paramNames.adminSubdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.adminDomain,
    });

    const auth = new Auth(scope, `FastPageAuthStack`, {
      env: props.env,
      adminGroupName: "FastPageAdmins",
    });

    new DataStack(scope, `FastPageDataStack`, {
      env: props.env,
      paramNameDDBTableName: props.appCfg.paramNames.ddbTableName,
      paramNameDDBTableArn: props.appCfg.paramNames.ddbTableArn,
    });

    const serviceList = ["page-service", "customer-service"];

    new FunctionsStack(scope, `FastPageFunctionsStack`, {
      env: props.env,
      deployEnv: props.targetEnv.name,
      paramNameDDBTableName: props.appCfg.paramNames.ddbTableName,
      paramNameDDBTableArn: props.appCfg.paramNames.ddbTableArn,
      serviceList: serviceList,
      userPool: auth.userPool,
      apiDomain: props.targetEnv.apiDomain,
      certificateArnParamName: props.appCfg.paramNames.certificateArnApi,
      hzIdParamName: props.appCfg.paramNames.apiDomainHostedZoneId,
    });
  }
}
