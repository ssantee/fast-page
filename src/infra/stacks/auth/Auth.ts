import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPoolGroup,
  UserPool,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { constructIds } from "./constructIds";

interface AuthProps extends StackProps {
  photosBucket: IBucket;
  AdminGroupName: string;
}

export class Auth extends Stack {
  public userPool: UserPool;
  private userPoolClient: UserPoolClient;
  private identityPool: CfnIdentityPool;
  private authenticatedRole: Role;
  private unAuthenticatedRole: Role;
  private adminRole: Role;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id, props);

    this.createUserPool();
    this.createUserPoolClient();
    this.createIdentityPool();
    this.createRoles(props.photosBucket);
    this.attachRoles();
    this.createAdminsGroup(props.AdminGroupName || "FastpageAdmins");
  }

  private createUserPool() {
    this.userPool = new UserPool(this, constructIds.UserPool, {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
    });

    new CfnOutput(this, constructIds.UserPoolOutputPoolId, {
      value: this.userPool.userPoolId,
    });
  }

  private createUserPoolClient() {
    this.userPoolClient = this.userPool.addClient(constructIds.UserPoolClient, {
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true,
      },
    });
    new CfnOutput(this, constructIds.UserPoolClientOutputClientId, {
      value: this.userPoolClient.userPoolClientId,
    });
  }

  private createAdminsGroup(groupName: string) {
    new CfnUserPoolGroup(this, constructIds.UserPoolGroupAdmin, {
      userPoolId: this.userPool.userPoolId,
      groupName: groupName,
      roleArn: this.adminRole.roleArn,
    });
  }

  private createIdentityPool() {
    this.identityPool = new CfnIdentityPool(this, constructIds.IdentityPool, {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });
    new CfnOutput(this, constructIds.IdentityPoolOutputRefId, {
      value: this.identityPool.ref,
    });
  }

  private createRoles(photosBucket: IBucket) {
    const cognitoFederatedPrincipal = "cognito-identity.amazonaws.com";

    this.authenticatedRole = new Role(
      this,
      constructIds.RoleAuthenticatedDefault,
      {
        assumedBy: new FederatedPrincipal(
          cognitoFederatedPrincipal,
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity",
        ),
      },
    );
    this.unAuthenticatedRole = new Role(
      this,
      constructIds.RoleUnauthenticatedDefault,
      {
        assumedBy: new FederatedPrincipal(
          cognitoFederatedPrincipal,
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity",
        ),
      },
    );
    this.adminRole = new Role(this, constructIds.RoleCognitoAdmin, {
      assumedBy: new FederatedPrincipal(
        cognitoFederatedPrincipal,
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });
    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:PutObjectAcl"],
        resources: [photosBucket.bucketArn + "/*"],
      }),
    );
    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:ListBucket"],
        resources: [photosBucket.bucketArn],
      }),
    );
    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:ListAllMyBuckets"],
        resources: ["*"],
      }),
    );
  }

  private attachRoles() {
    new CfnIdentityPoolRoleAttachment(this, constructIds.IdpRoleAttachment, {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unAuthenticatedRole.roleArn,
      },
      roleMappings: {
        adminsMapping: {
          type: "Token",
          ambiguousRoleResolution: "AuthenticatedRole",
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });
  }
}
