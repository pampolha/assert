import dynamoose from "dynamoose";
import dotenv from "dotenv";
import { awsAccessKey, awsRegion, awsSecretKey } from "../../shared/env.js";

dotenv.config();

const ddb = new dynamoose.aws.ddb.DynamoDB({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
  },
  region: awsRegion,
});

dynamoose.aws.ddb.set(ddb);

export {ddb};
