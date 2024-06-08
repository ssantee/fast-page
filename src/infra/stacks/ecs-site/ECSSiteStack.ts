import {
  aws_ecr_assets,
  aws_ecs as ecs,
  aws_ecs_patterns,
  aws_route53 as route53,
  aws_ssm as ssm,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "node:path";
import {
  ApplicationProtocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ApplicationLoadBalancedServiceRecordType } from "aws-cdk-lib/aws-ecs-patterns";

interface ECSSiteStackProps extends StackProps {
  deployEnv: string;
  assetsDir: string;
  certificateArnParamName: string;
  hzIdParamName: string;
  deployEnvDomain: string;
}

export class ECSSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: ECSSiteStackProps) {
    super(scope, id);

    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      props.certificateArnParamName,
    );
    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      props.hzIdParamName,
    );

    const cluster: ecs.Cluster = new ecs.Cluster(this, "Cluster", {});

    const image = ecs.ContainerImage.fromDockerImageAsset(
      new aws_ecr_assets.DockerImageAsset(this, "Image", {
        platform: aws_ecr_assets.Platform.LINUX_ARM64,
        directory: path.join(process.cwd(), "src", "ui", "admin"),
      }),
    );

    const fargateService =
      new aws_ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "ECSService",
        {
          cluster,
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            image: image,
            containerPort: 3000,
            environment: {
              ENVIRONMENT: props.deployEnv,
            },
          },
          runtimePlatform: {
            operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            cpuArchitecture: ecs.CpuArchitecture.ARM64,
          },
          healthCheck: {
            command: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 0"],
            // the properties below are optional
            interval: Duration.seconds(30),
            retries: 1,
            startPeriod: Duration.seconds(90),
            timeout: Duration.seconds(5),
          },
          protocol: ApplicationProtocol.HTTPS,
          certificate: Certificate.fromCertificateArn(
            this,
            "Cert",
            certificateArn,
          ),
          sslPolicy: SslPolicy.RECOMMENDED_TLS,
          redirectHTTP: true,
          recordType: ApplicationLoadBalancedServiceRecordType.ALIAS,
          idleTimeout: Duration.seconds(400),
          domainName: props.deployEnvDomain,
          domainZone: route53.PublicHostedZone.fromPublicHostedZoneAttributes(
            this,
            "HostedZoneRecord",
            {
              hostedZoneId: hostedZoneId,
              zoneName: props.deployEnvDomain,
            },
          ),
          assignPublicIp: true,
        },
      );

    fargateService.targetGroup.enableCookieStickiness(
      Duration.days(1),
      "fp-session",
    );
  }
}
