import {
  aws_ssm as ssm,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";

interface DataStackProps extends StackProps {
  paramNameDDBTableName: string;
  paramNameDDBTableArn: string;
}

export default class DataStack extends Stack {
  public readonly ddbTable: ITable;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.ddbTable = new Table(this, "FPDDBTable", {
      partitionKey: { name: "UserID", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, "mySsmParameter", {
      parameterName: props.paramNameDDBTableName,
      stringValue: this.ddbTable.tableName,
    });

    new ssm.StringParameter(this, "mySsmParameter1", {
      parameterName: props.paramNameDDBTableArn,
      stringValue: this.ddbTable.tableArn,
    });

    new CfnOutput(this, "FPDDBTableName", {
      value: this.ddbTable.tableName,
    });
  }
}
