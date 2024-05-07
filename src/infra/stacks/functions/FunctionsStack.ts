import {
  aws_route53 as route53,
  aws_route53_targets,
  aws_ssm as ssm,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import ServerlessServiceGo from "../../constructs/ServerlessServiceGo";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  EndpointType,
  LambdaIntegration,
  MethodOptions,
  ResourceOptions,
  RestApi,
  SecurityPolicy,
} from "aws-cdk-lib/aws-apigateway";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

interface FunctionsStackProps extends StackProps {
  deployEnv: string;
  paramNameDDBTableName: string;
  paramNameDDBTableArn: string;
  serviceList: string[];
  userPool: UserPool;
  apiDomain: string;
  certificateArnParamName: string;
  hzIdParamName: string;
}

export default class FunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props: FunctionsStackProps) {
    super(scope, id, props);

    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      props.certificateArnParamName,
    );

    const hzId = ssm.StringParameter.valueForStringParameter(
      this,
      props.hzIdParamName,
    );

    const cert = Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateArn,
    );

    const api = new RestApi(this, "FPServiceAPI", {
      deploy: true,
      description: "FastPage Service API",
      deployOptions: {
        stageName: props.deployEnv,
      },
    });

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "FPServiceAPIAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        identitySource: "method.request.header.Authorization",
      },
    );

    authorizer._attachToApi(api);

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    const optionsWithAuth: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    };

    props.serviceList.forEach((service) => {
      const myFunc = new ServerlessServiceGo(this, `FastPage${service}`, {
        env: props.env,
        deployEnv: props.deployEnv,
        paramNameDDBTableName: props.paramNameDDBTableName,
        paramNameDDBTableArn: props.paramNameDDBTableArn,
        serviceName: service,
        userPool: props.userPool,
        authorizerId: authorizer.authorizerId,
        restApiId: api.restApiId,
        rootResourceId: api.restApiRootResourceId,
      });

      const lambdaIntegration = new LambdaIntegration(
        myFunc.lambdaFunction,
        {},
      );

      const pathPart =
        service.indexOf("-") !== -1
          ? service.substring(0, service.indexOf("-"))
          : service;

      const apiResource = api.root.addResource(pathPart, optionsWithCors);

      apiResource.addMethod("GET", lambdaIntegration, optionsWithAuth);
      apiResource.addMethod("POST", lambdaIntegration, optionsWithAuth);
      apiResource.addMethod("PUT", lambdaIntegration, optionsWithAuth);
      apiResource.addMethod("DELETE", lambdaIntegration, optionsWithAuth);
    });

    api.addDomainName("APIDomain", {
      certificate: cert,
      endpointType: EndpointType.EDGE,
      securityPolicy: SecurityPolicy.TLS_1_2,
      domainName: props.apiDomain,
    });

    new route53.ARecord(this, "APIAliasRecord", {
      target: route53.RecordTarget.fromAlias(
        new aws_route53_targets.ApiGateway(api),
      ),
      zone: route53.PublicHostedZone.fromPublicHostedZoneAttributes(
        this,
        "HostedZoneRecord",
        {
          hostedZoneId: hzId,
          zoneName: props.apiDomain,
        },
      ),
    });
  }
}
