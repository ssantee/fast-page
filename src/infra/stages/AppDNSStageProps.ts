import { StageProps } from "aws-cdk-lib";
import { EnvConfig } from "../util/AppConfiguration";

export interface AppDNSStageProps extends StageProps {
  assetsDir?: string;
  mgmtEnv: EnvConfig;
  targetEnv: EnvConfig;
  certificateArnParamName: string;
  certificateArnParamNameAdmin: string;
  subdomainHostedZoneIdParamName: string;
  adminSubdomainHostedZoneIdParamName: string;
  certificateArnParamNameApi: string;
  apiSubdomainHostedZoneIdParamName: string;
  apiDomain: string;
}
