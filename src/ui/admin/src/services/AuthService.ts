import { Amplify, Auth } from "aws-amplify";
import { type CognitoUser } from "@aws-amplify/auth";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const awsRegion = "us-east-1";
const identityPoolId = "us-east-1:515bd317-9501-451f-9c2c-1ad6db5706d1";
const userPoolId = "us-east-1_0Q7QtJdSB";
const userPoolClientId = "6iv2ud13p39mtlol53q7upk2k6";
Amplify.configure({
  Auth: {
    region: awsRegion,
    userPoolId: userPoolId,
    userPoolWebClientId: userPoolClientId,
    identityPoolId: identityPoolId,
    authenticationFlowType: "USER_PASSWORD_AUTH",
  },
});

export class AuthService {
  private user: CognitoUser | undefined;
  public jwtToken: string | undefined;
  private temporaryCredentials: object | undefined;

  public isAuthorized() {
    if (this.user) {
      return true;
    }
    return false;
  }

  public async login(
    userName: string,
    password: string,
  ): Promise<Object | undefined> {
    try {
      this.user = (await Auth.signIn(userName, password)) as CognitoUser;
      this.jwtToken = this.user
        ?.getSignInUserSession()
        ?.getIdToken()
        .getJwtToken();
      return this.user;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async getTemporaryCredentials() {
    if (this.temporaryCredentials) {
      return this.temporaryCredentials;
    }
    this.temporaryCredentials = await this.generateTemporaryCredentials();
    return this.temporaryCredentials;
  }

  public getUserName() {
    return this.user?.getUsername();
  }

  private async generateTemporaryCredentials() {
    const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/${userPoolId}`;
    const cognitoIdentity = new CognitoIdentityClient({
      credentials: fromCognitoIdentityPool({
        clientConfig: {
          region: awsRegion,
        },
        identityPoolId: identityPoolId,
        logins: {
          [cognitoIdentityPool]: this.jwtToken!,
        },
      }),
    });
    const credentials = await cognitoIdentity.config.credentials();
    return credentials;
  }
}
