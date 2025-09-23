const getOrThrow = (key: string): string => {
  const attemptedValue = Deno.env.get(key);
  if (!attemptedValue) {
    throw new Error(`Could not get environment variable ${key}`);
  }
  return attemptedValue;
};

const botToken = getOrThrow("BOT_TOKEN");
const botClientId = getOrThrow("BOT_CLIENT_ID");
const openrouterKey = getOrThrow("OPENROUTER_API_KEY");
const mainChannelId = getOrThrow("MAIN_CHANNEL_ID");
const awsAccessKeyId = getOrThrow("AWS_ACCESS_KEY_ID");
const awsSecretAccessKey = getOrThrow("AWS_SECRET_ACCESS_KEY");
const awsRegion = getOrThrow("AWS_REGION");

export {
  awsAccessKeyId,
  awsRegion,
  awsSecretAccessKey,
  botClientId,
  botToken,
  mainChannelId,
  openrouterKey,
};
