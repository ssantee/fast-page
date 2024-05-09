import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EnvConfig } from "../util/AppConfiguration";
import { MgmtAcctDNSRoleStack } from "../stacks/dns/MgmtAcctDNSRoleStack";

export interface MgmtAccountStageProps extends StageProps {
  assetsDir?: string;
  mgmtEnv: EnvConfig;
  targetEnv: EnvConfig;
  apiDomain: string;
  iamPrincipalAccountNo: string;
}

export class MgmtAccountStage extends Stage {
  constructor(scope: Construct, id: string, props: MgmtAccountStageProps) {
    super(scope, id, props);

    new MgmtAcctDNSRoleStack(scope, `FastPageMgmtAcctDNSRoleStack`, {
      env: { account: props.mgmtEnv.account, region: props.mgmtEnv.region },
      description: "Cross-account delegation role for Fast Page subdomains.",
      mgmtEnv: props.mgmtEnv,
      targetEnv: props.targetEnv,
      iamPrincipalAccountNo: props.mgmtEnv.account,
      apiDomain: props.mgmtEnv.apiDomain,
    });
  }
}
