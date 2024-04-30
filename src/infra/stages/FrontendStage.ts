import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { S3CloudfrontSiteStack } from "../stacks/s3-cloudfront-site/S3CloudfrontSiteStack";
import { AppDNSStageProps } from "./AppDNSStageProps";

export class BackendStage extends Stage {
  constructor(scope: Construct, id: string, props?: AppDNSStageProps) {
    super(scope, id, props);
  }
}
