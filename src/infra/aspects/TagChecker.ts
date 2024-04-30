import { Annotations, IAspect, Tags } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { CfnBucket } from "aws-cdk-lib/aws-s3";

export class TagChecker implements IAspect {
  private key: string;
  private value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }

  public visit(node: IConstruct): void {
    if (node instanceof CfnBucket) {
      if (!Object.keys(node.tags.tagValues()).includes(this.key)) {
        Annotations.of(node).addError(
          `Missing required tag "${this.key}" on stack with id "${node.stack.stackId}".`,
        );
      }
    }
  }
}
