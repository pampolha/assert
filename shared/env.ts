import dotenv from "dotenv";
dotenv.config();

const getOrThrow = (key: string): string => {
  const attemptedValue = process.env[key];
  if (!attemptedValue) {
    throw new Error(`Could not get environment variable ${key}`);
  }
  return attemptedValue;
};

const botToken = getOrThrow("BOT_TOKEN");
const botClientId = getOrThrow("BOT_CLIENT_ID");
const generatorApiGatewayUrl = getOrThrow("API_GATEWAY_URL");
const openAiKey = getOrThrow("OPENAI_API_KEY");
const debugGuildId = getOrThrow("DEBUG_GUILD_ID");
const awsSecretKey = getOrThrow("AWS_SECRET_ACCESS_KEY");
const awsAccessKey = getOrThrow("AWS_ACCESS_KEY_ID");
const awsRegion = getOrThrow("AWS_REGION");

export { openAiKey, botClientId, botToken, debugGuildId, generatorApiGatewayUrl, awsAccessKey, awsSecretKey, awsRegion };
