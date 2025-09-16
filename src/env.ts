const getOrThrow = (key: string): string => {
  const attemptedValue = Deno.env.get(key);
  if (!attemptedValue) {
    throw new Error(`Could not get environment variable ${key}`);
  }
  return attemptedValue;
};

const botToken = getOrThrow("BOT_TOKEN");
const botClientId = getOrThrow("BOT_CLIENT_ID");
const generatorApiGatewayUrl = getOrThrow("API_GATEWAY_URL");
const openrouterKey = getOrThrow("OPENROUTER_API_KEY");
const debugGuildId = getOrThrow("DEBUG_GUILD_ID");
const mainChannelId = getOrThrow("MAIN_CHANNEL_ID");
const awsAccessKeyId = getOrThrow("AWS_ACCESS_KEY_ID");
const awsSecretAccessKey = getOrThrow("AWS_SECRET_ACCESS_KEY");
const awsRegion = getOrThrow("AWS_REGION");
const myUserId = getOrThrow("MY_USER_ID");

export {
  awsAccessKeyId,
  awsRegion,
  awsSecretAccessKey,
  botClientId,
  botToken,
  debugGuildId,
  generatorApiGatewayUrl,
  mainChannelId,
  myUserId,
  openrouterKey,
};
