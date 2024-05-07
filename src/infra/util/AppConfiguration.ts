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
  public deployEnv: string;
  public targetEnv: EnvConfig;
  public mgmtEnv: EnvConfig;
  public paramNames: ParamConfig;

  constructor(configData: AppConfig, deployEnv: string) {
    this.deployEnv = deployEnv;
    this.targetEnv = this.getTargetEnv(configData.environments);
    this.mgmtEnv = this.getMgmtEnv(configData.environments, "root");
    this.paramNames = configData.parameterNames;
  }

  private getTargetEnv(envs: EnvConfig[]): EnvConfig {
    return envs.find((e) => e.name === this.deployEnv)!;
  }
  private getMgmtEnv(envs: EnvConfig[], mgmtAcctName: string): EnvConfig {
    return envs.find((e) => e.name === mgmtAcctName)!;
  }
}
