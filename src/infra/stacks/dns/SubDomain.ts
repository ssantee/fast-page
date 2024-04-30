import {
  aws_route53 as route53,
  aws_iam as iam,
  aws_ssm as ssm,
  Stack,
  StackProps,
  SecretValue,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { DomainEnv } from "../../../shared/types";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface SubDomainProps extends StackProps {
  mgmtEnvAcctNo: string;
  certificateArnParamName: string;
  subdomainHostedZoneIdParamName: string;
  deployEnvDomain: string;
  mgmtEnvDomain: string;
}

export class SubDomain extends Stack {
  constructor(scope: Construct, id: string, props: SubDomainProps) {
    super(scope, id);

    const subZone = new route53.PublicHostedZone(this, "Route53FPSubZone", {
      zoneName: props.deployEnvDomain,
    });

    // import the delegation role by constructing the roleArn
    const delegationRoleArn = Stack.of(this).formatArn({
      region: "", // IAM is global in each partition
      service: "iam",
      account: props.mgmtEnvAcctNo,
      resource: "role",
      resourceName: "MyXAcctDelegationRole", // Do not change
    });

    const delegationRole = iam.Role.fromRoleArn(
      this,
      "DelegationRole",
      delegationRoleArn,
    );

    // create the record
    new route53.CrossAccountZoneDelegationRecord(
      this,
      "CrossAccountZoneDelegationRecord",
      {
        delegatedZone: subZone,
        parentHostedZoneName: props.mgmtEnvDomain,
        delegationRole,
        assumeRoleRegion: "us-east-1",
      },
    );

    const certificate = new Certificate(this, "DelegatedZoneCert", {
      domainName: props.deployEnvDomain,
      validation: CertificateValidation.fromDns(subZone),
    });

    new ssm.StringParameter(this, "mySsmParameter", {
      parameterName: props.certificateArnParamName,
      stringValue: certificate.certificateArn,
    });

    new ssm.StringParameter(this, "mySsmParameter1", {
      parameterName: props.subdomainHostedZoneIdParamName,
      stringValue: subZone.hostedZoneId,
    });
  }
}
