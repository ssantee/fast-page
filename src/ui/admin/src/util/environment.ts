import config from "@/amplifyconfiguration.json";

export class Environment {
  public static readonly isProd = process.env.ENVIRONMENT === "prod";
  public static readonly envString: string =
    process.env.ENVIRONMENT === "prod" ? "prod" : "dev";
  public static GetAmplifyConfigForEnvironment() {
    return Environment.isProd ? config.prod : config.dev;
  }
}
