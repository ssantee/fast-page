import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { Environment } from "@/util/environment";

const ampConfig = Environment.GetAmplifyConfigForEnvironment();
export const { runWithAmplifyServerContext } = createServerRunner({
  config: ampConfig,
});
