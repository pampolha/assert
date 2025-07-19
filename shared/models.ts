import dynamoose from 'npm:dynamoose';
import type { SchemaDefinition } from 'npm:dynamoose/dist/Schema';

const sessionSchema: SchemaDefinition = {
  PK: {
    type: String,
    hashKey: true,
  },
  SK: {
    type: String,
    rangeKey: true,
  },
  GSI1PK: String,
  GSI1SK: String,
  GSI2PK: String,
  GSI2SK: String,
  ScenarioData: Object,
  NPCs: Array,
  Status: String,
  UserID: String,
  expiry_date: Number,
};

const npcSchema: SchemaDefinition = {
  PK: {
    type: String,
    hashKey: true,
  },
  SK: {
    type: String,
    rangeKey: true,
  },
  Name: String,
  ResponsePattern: String,
  LastInteraction: Date,
  SessionID: String,
};

export const Session = dynamoose.model('Session', new dynamoose.Schema(sessionSchema));
export const NPC = dynamoose.model('NPC', new dynamoose.Schema(npcSchema));