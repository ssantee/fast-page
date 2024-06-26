import {
  aws_route53 as route53,
  aws_iam as iam,
  CfnOutput,
  Stack,
  StackProps,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { EnvConfig } from "../../util/AppConfiguration";

interface MgmtAcctDNSProps extends StackProps {
  iamPrincipalAccountNo: string;
  mgmtEnv: EnvConfig;
  apiDomain: string;
  devEnv: EnvConfig;
  prodEnv: EnvConfig;
  domainList: Array<string>;
  tld: string;
  tldHzId: string;
}

export class MgmtAcctDNSRoleStack extends Stack {
  constructor(scope: Construct, id: string, props: MgmtAcctDNSProps) {
    super(scope, id);

    const newZone = new route53.PublicHostedZone(this, "HostedZone", {
      zoneName: props.mgmtEnv.domain,
    });

    const newAdminZone = new route53.PublicHostedZone(this, "HostedZoneAdmin", {
      zoneName: props.mgmtEnv.adminDomain,
    });

    const newApiZone = new route53.PublicHostedZone(this, "HostedZoneApi", {
      zoneName: props.apiDomain,
    });

    const crossAccountRole = new iam.Role(this, "CrossAccountRole", {
      // The role name must be predictable
      roleName: "MyXAcctDelegationRole",
      // The other account
      assumedBy: new iam.AccountPrincipal(props.devEnv.account),
      // You can scope down this role policy to be least privileged.
      // If you want the other account to be able to manage specific records,
      // you can scope down by resource and/or normalized record names
      inlinePolicies: {
        crossAccountPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "ListHostedZonesByName",
              effect: iam.Effect.ALLOW,
              actions: ["route53:ListHostedZonesByName"],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              sid: "GetHostedZoneAndChangeResourceRecordSets",
              effect: iam.Effect.ALLOW,
              actions: [
                "route53:GetHostedZone",
                "route53:ChangeResourceRecordSets",
              ],
              resources: [
                `arn:aws:route53:::hostedzone/${newZone.hostedZoneId}`,
              ],
              conditions: {
                "ForAllValues:StringLike": {
                  "route53:ChangeResourceRecordSetsNormalizedRecordNames": [
                    ...props.domainList,
                  ],
                },
              },
            }),
          ],
        }),
      },
    });

    crossAccountRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        principals: [new iam.AccountPrincipal(props.prodEnv.account)],
      }),
    );

    newZone.grantDelegation(crossAccountRole);
    newAdminZone.grantDelegation(crossAccountRole);
    newApiZone.grantDelegation(crossAccountRole);

    const tldZone = route53.PublicHostedZone.fromPublicHostedZoneAttributes(
      this,
      "TLDZone",
      {
        hostedZoneId: props.tldHzId,
        zoneName: props.tld,
      },
    );

    new route53.NsRecord(this, "SubDomainNSRecord", {
      zone: tldZone,
      recordName: props.mgmtEnv.domain,
      values: newZone.hostedZoneNameServers || [],
      ttl: Duration.seconds(172800),
    });

    new route53.NsRecord(this, "DomainNSRecordAdmin", {
      zone: tldZone,
      recordName: props.mgmtEnv.adminDomain,
      values: newAdminZone.hostedZoneNameServers || [],
      ttl: Duration.seconds(172800),
    });

    new route53.NsRecord(this, "ApiDomainNSRecord", {
      zone: tldZone,
      recordName: props.apiDomain,
      values: newApiZone.hostedZoneNameServers || [],
      ttl: Duration.seconds(172800),
    });

    new CfnOutput(this, "CrossAccountDelegationRoleArn", {
      description: "CrossAccountDelegationRoleArn",
      value: crossAccountRole.roleArn,
    });
  }
}
