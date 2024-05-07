import { StageProps } from "aws-cdk-lib";
import { DomainEnv } from "../../shared/types";

export interface AppDNSStageProps extends StageProps {
  deployEnv: string;
  assetsDir?: string;
  allEnvs?: { [env: string]: DomainEnv };
  mgmtEnv: DomainEnv;
  targetEnv: DomainEnv;
  certificateArnParamName: string;
  certificateArnParamNameAdmin: string;
  subdomainHostedZoneIdParamName: string;
  adminSubdomainHostedZoneIdParamName: string;
  certificateArnParamNameApi: string;
  apiSubdomainHostedZoneIdParamName: string;
  apiDomain: string;
}
