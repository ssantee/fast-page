import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppConfiguration, EnvConfig } from "../util/AppConfiguration";
import { S3CloudfrontSiteStack } from "../stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { Auth } from "../stacks/auth/Auth";
import DataStack from "../stacks/data/DataStack";
import FunctionsStack from "../stacks/functions/FunctionsStack";
import { SubDomain } from "../stacks/dns/SubDomain";
import { IamStack } from "../stacks/iam/IamStack";

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

    const iamStack = new IamStack(this, `FastPageIamStack`, {
      env: props.env,
      mgmtAccount: props.mgmtEnv.account,
    });

    const sub = new SubDomain(this, `FastPageProdSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamName,
      subdomainHostedZoneIdParamName: props.subdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.domain,
      mgmtEnvDomain: props.mgmtEnv.domain,
    });

    sub.addDependency(iamStack);

    const subAdmin = new SubDomain(this, `FastPageProdAdminSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamNameAdmin,
      subdomainHostedZoneIdParamName: props.adminSubdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.adminDomain,
      mgmtEnvDomain: props.mgmtEnv.adminDomain,
    });

    subAdmin.addDependency(iamStack);

    const subApi = new SubDomain(this, `FastPageProdApiSubDomainStack`, {
      env: props.env,
      mgmtEnvAcctNo: props.mgmtEnv.account,
      description:
        "Hosted zones for Fast Page subdomains with cross-account delegation.",
      certificateArnParamName: props.certificateArnParamNameApi,
      subdomainHostedZoneIdParamName: props.apiSubdomainHostedZoneIdParamName,
      deployEnvDomain: props.targetEnv.apiDomain,
      mgmtEnvDomain: props.mgmtEnv.apiDomain,
    });

    subApi.addDependency(iamStack);

    new S3CloudfrontSiteStack(this, `FastPageProdWebPublicStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Public Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArn,
      hzIdParamName: props.appCfg.paramNames.subdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.domain,
    }).addDependency(sub);

    new S3CloudfrontSiteStack(this, `FastPageProdWebAdminStack`, {
      deployEnv: props.targetEnv.name,
      env: props.env,
      description: "Web Admin Stack",
      assetsDir: props.assetsDir,
      certificateArnParamName: props.appCfg.paramNames.certificateArnAdmin,
      hzIdParamName: props.appCfg.paramNames.adminSubdomainHostedZoneId,
      deployEnvDomain: props.targetEnv.adminDomain,
    }).addDependency(subAdmin);

    const auth = new Auth(this, `FastPageProdAuthStack`, {
      env: props.env,
      adminGroupName: "FastPageAdmins",
    });

    new DataStack(this, `FastPageProdDataStack`, {
      env: props.env,
      paramNameDDBTableName: props.appCfg.paramNames.ddbTableName,
      paramNameDDBTableArn: props.appCfg.paramNames.ddbTableArn,
    });

    const serviceList = ["page-service", "customer-service"];

    new FunctionsStack(this, `FastPageProdFunctionsStack`, {
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
