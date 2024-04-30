import { Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppDNSStageProps } from "./AppDNSStageProps";
import { SubDomain } from "../stacks/dns/SubDomain";

export class DNSStage extends Stage {
  constructor(scope: Construct, id: string, props: AppDNSStageProps) {
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
  }
}
