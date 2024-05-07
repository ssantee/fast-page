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
import { Construct } from "constructs";
import { constructIds } from "./constructIds";

interface AuthProps extends StackProps {
  adminGroupName: string;
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

    this.userPool = new UserPool(this, constructIds.UserPool, {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
    });

    new CfnOutput(this, constructIds.UserPoolOutputPoolId, {
      value: this.userPool.userPoolId,
    });

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

    this.createRoles();

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

    new CfnUserPoolGroup(this, constructIds.UserPoolGroupAdmin, {
      userPoolId: this.userPool.userPoolId,
      groupName: props.adminGroupName,
      roleArn: this.adminRole.roleArn,
    });
  }

  private createRoles() {
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
  }
}
