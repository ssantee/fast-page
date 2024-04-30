import {
  aws_s3_deployment,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_route53 as route53,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import * as path from "node:path";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";

interface WebPublicProps extends StackProps {
  deployEnv: string;
  assetsDir: string;
  certificateArnParamName: string;
  hzIdParamName: string;
  deployEnvDomain: string;
}

export class S3CloudfrontSiteStack extends Stack {
  public distribution: Distribution;

  constructor(scope: Construct, id: string, props: WebPublicProps) {
    super(scope, id);

    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      props.certificateArnParamName,
    );
    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      props.hzIdParamName,
    );

    const bucketRemovalPolicy =
      props.deployEnv === "dev" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;
    const autoRemoveObjects = props.deployEnv === "dev";

    const cfToS3 = new CloudFrontToS3(this, "fp-web-public", {
      bucketProps: {
        removalPolicy: bucketRemovalPolicy,
        autoDeleteObjects: autoRemoveObjects,
      },
      cloudFrontDistributionProps: {
        domainNames: [props.deployEnvDomain],
        certificate: Certificate.fromCertificateArn(
          this,
          "Cert",
          certificateArn,
        ),
      },
    });

    // create alias record in route53 for the CloudFront distribution
    new route53.AaaaRecord(this, "Alias", {
      zone: route53.PublicHostedZone.fromPublicHostedZoneAttributes(
        this,
        "HostedZoneRecord",
        {
          hostedZoneId: hostedZoneId,
          zoneName: props.deployEnvDomain,
        },
      ),
      target: route53.RecordTarget.fromAlias(
        new CloudFrontTarget(cfToS3.cloudFrontWebDistribution),
      ),
    });

    this.distribution = cfToS3.cloudFrontWebDistribution;

    new aws_s3_deployment.BucketDeployment(this, "DeployPlaceholderFile", {
      sources: [
        aws_s3_deployment.Source.asset(
          path.join(props.assetsDir, "/web-public"),
          {
            exclude: ["**", "!index.html"],
          },
        ),
      ],
      destinationBucket: cfToS3.s3BucketInterface,
      distribution: cfToS3.cloudFrontWebDistribution,
      // optional paths to invalidate in cache
      distributionPaths: ["/index.html"],
    });

    new CfnOutput(this, "BucketName", {
      value: cfToS3.s3Bucket?.bucketName || "NoBucketName",
    });

    new CfnOutput(this, "CFDistUrl", {
      value: `https://${
        cfToS3.cloudFrontWebDistribution.distributionDomainName || "NoCFDistUrl"
      }`,
    });
  }
}
