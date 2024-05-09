export type EnvConfig = {
  name: string;
  domain: string;
  account: string;
  region: string;
  adminDomain: string;
  apiDomain: string;
};

type ParamConfig = {
  certificateArn: string;
  certificateArnAdmin: string;
  certificateArnApi: string;
  subdomainHostedZoneId: string;
  adminSubdomainHostedZoneId: string;
  apiDomainHostedZoneId: string;
  ddbTableName: string;
  ddbTableArn: string;
};

export type AppConfig = {
  environments: EnvConfig[];
  parameterNames: ParamConfig;
};

export class AppConfiguration {
  // public deployEnv: string;
  // public targetEnv: EnvConfig;
  public mgmtEnv: EnvConfig;
  public paramNames: ParamConfig;
  public prodEnv: EnvConfig;
  public devEnv: EnvConfig;

  constructor(configData: AppConfig) {
    // this helps us to determine the target env among the configured envs.
    // this.deployEnv = deployEnv;
    // this.targetEnv = this.getTargetEnv(configData.environments);
    this.mgmtEnv = this.getMgmtEnv(configData.environments, "root");
    this.prodEnv = this.getMgmtEnv(configData.environments, "prod");
    this.devEnv = this.getMgmtEnv(configData.environments, "dev");
    this.paramNames = configData.parameterNames;
  }

  // private getTargetEnv(envs: EnvConfig[]): EnvConfig {
  //   return envs.find((e) => e.name === this.deployEnv)!;
  // }
  private getMgmtEnv(envs: EnvConfig[], acctEnv: string): EnvConfig {
    return envs.find((e) => e.name === acctEnv)!;
  }
}
