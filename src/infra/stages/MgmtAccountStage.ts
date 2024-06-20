import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppConfiguration, EnvConfig } from "../util/AppConfiguration";
import { MgmtAcctDNSRoleStack } from "../stacks/dns/MgmtAcctDNSRoleStack";

export interface MgmtAccountStageProps extends StageProps {
  mgmtEnv: EnvConfig;
  apiDomain: string;
  iamPrincipalAccountNo: string;
  devEnv: EnvConfig;
  prodEnv: EnvConfig;
  appCfg: AppConfiguration;
}

export class MgmtAccountStage extends Stage {
  constructor(scope: Construct, id: string, props: MgmtAccountStageProps) {
    super(scope, id, props);

    new MgmtAcctDNSRoleStack(this, `FPMgmtAcctDNSRoleStack`, {
      env: { account: props.mgmtEnv.account, region: props.mgmtEnv.region },
      description: "Cross-account delegation role for Fast Page subdomains.",
      mgmtEnv: props.mgmtEnv,
      iamPrincipalAccountNo: props.mgmtEnv.account,
      apiDomain: props.mgmtEnv.apiDomain,
      devEnv: props.devEnv,
      prodEnv: props.prodEnv,
      domainList: props.appCfg.getDomainsFromConfig(),
      tld: props.appCfg.tld,
      tldHzId: props.appCfg.tldHzId,
    });
  }
}
