export type EnvConfig = {
  name: string;
  domain: string;
  account: string;
  region: string;
  adminDomain: string;
  apiDomain: string;
  constructIdPart?: string;
  pipelineRequiresApproval?: boolean;
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
  public deployableEnvs: EnvConfig[] = [];

  constructor(configData: AppConfig) {
    this.mgmtEnv = this.getEnvByName(configData.environments, "root");
    this.prodEnv = this.getEnvByName(configData.environments, "prod");
    this.devEnv = this.getEnvByName(configData.environments, "dev");
    this.paramNames = configData.parameterNames;
    this.configBucketName = configData.configBucketName;
    this.repositoryArn = configData.repositoryArn;
    this.deployableEnvs = configData.environments.filter(
      (e) => e.name !== "root",
    );

    const envNamesValidLength = this.deployableEnvs.every((env) => {
      return env.name.length >= 3;
    });

    if (!envNamesValidLength) {
      throw new Error("Environment names must be at least 3 characters.");
    }

    this.deployableEnvs.forEach((env) => {
      env.constructIdPart =
        env.name.charAt(0).toUpperCase() + env.name.slice(1);
    });
  }

  private getEnvByName(envs: EnvConfig[], acctEnv: string): EnvConfig {
    return envs.find((e) => e.name === acctEnv)!;
  }
}
