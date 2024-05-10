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
  configBucketName: string;
  repositoryArn: string;
};

export class AppConfiguration {
  public mgmtEnv: EnvConfig;
  public paramNames: ParamConfig;
  public prodEnv: EnvConfig;
  public devEnv: EnvConfig;
  public configBucketName: string;
  public repositoryArn: string;

  constructor(configData: AppConfig) {
    this.mgmtEnv = this.getMgmtEnv(configData.environments, "root");
    this.prodEnv = this.getMgmtEnv(configData.environments, "prod");
    this.devEnv = this.getMgmtEnv(configData.environments, "dev");
    this.paramNames = configData.parameterNames;
    this.configBucketName = configData.configBucketName;
    this.repositoryArn = configData.repositoryArn;
  }

  private getMgmtEnv(envs: EnvConfig[], acctEnv: string): EnvConfig {
    return envs.find((e) => e.name === acctEnv)!;
  }
}
