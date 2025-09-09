import { type Entity, type OneSchema, Table } from "npm:dynamodb-onetable";
import { DynamoDBClient } from "npm:@aws-sdk/client-dynamodb";
import { awsAccessKeyId, awsRegion, awsSecretAccessKey } from "../src/env.ts";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
  region: awsRegion,
});

const schema = {
  format: "onetable:1.1.0",
  version: "0.0.1",
  name: "assert-table",
  indexes: {
    primary: { hash: "PK", sort: "SK" },
    gs1: { hash: "GS1PK", sort: "GS1SK" },
  },
  models: {
    Session: {
      sessionId: {
        type: String,
        required: true,
      },
      scenarioId: { type: String, required: true },
      status: {
        type: String,
        enum: ["FORMING", "ACTIVE", "ENDED"],
        required: true,
      },
      expiryDate: { type: Number, ttl: true, required: true },
      PK: { type: String, value: "SESSION#${sessionId}" },
      SK: { type: String, value: "SESSION" },
      GS1PK: { type: String, value: "SESSION#${status}" },
      GS1SK: { type: String, value: "SESSION#${created}" },
      created: { type: Date, timestamp: true },
      updated: { type: Date, timestamp: true },
    },
    SessionParticipant: {
      sessionId: { type: String, required: true },
      participantId: { type: String, required: true },
      username: { type: String, required: true },
      role: { type: String, enum: ["owner", "member"], required: true },
      PK: { type: String, value: "SESSION#${sessionId}" },
      SK: { type: String, value: "PARTICIPANT#${participantId}" },
      GS1PK: { type: String, value: "PARTICIPANT#${participantId}" },
      GS1SK: { type: String, value: "SESSION#${sessionId}" },
      created: { type: Date, timestamp: true },
      updated: { type: Date, timestamp: true },
    },
    SessionChannel: {
      sessionId: { type: String, required: true },
      channelId: { type: String, required: true },
      type: {
        type: String,
        required: true,
        enum: ["category", "textChannel", "voiceChannel"],
      },
      PK: { type: String, value: "SESSION#${sessionId}" },
      SK: { type: String, value: "CHANNEL#${channelId}" },
      GS1PK: { type: String, value: "CHANNEL#${channelId}" },
      GS1SK: { type: String, value: "CHANNEL#${type}" },
      created: { type: Date, timestamp: true },
      updated: { type: Date, timestamp: true },
    },
    SessionFeedback: {
      sessionId: { type: String, required: true },
      feedbackGiverId: { type: String, required: true },
      feedbackReceiverId: { type: String, required: true },
      feedbackText: { type: String, required: true },
      PK: { type: String, value: "SESSION#${sessionId}" },
      SK: {
        type: String,
        value: "FEEDBACK#TO${feedbackReceiverId}#FROM${feedbackGiverId}",
      },
      GS1PK: {
        type: String,
        value: "FEEDBACK#${feedbackReceiverId}",
      },
      GS1SK: { type: String, value: "FEEDBACK#${feedbackGiverId}" },
      created: { type: Date, timestamp: true },
      updated: { type: Date, timestamp: true },
    },
    Scenario: {
      scenarioId: { type: String, required: true },
      corporate: {
        type: Object,
        required: true,
        schema: {
          company_name: { type: String, required: true },
          company_history: { type: String, required: true },
          current_project: { type: String, required: true },
        },
      },
      challenge: { type: String, required: true },
      characters: {
        type: Array,
        required: true,
        items: {
          type: Object,
          required: true,
          schema: {
            name: { type: String, required: true },
            role: { type: String, required: true },
            background: { type: String, required: true },
            ace: { type: String, required: true },
          },
        },
      },
      npcs: {
        type: Array,
        required: true,
        items: {
          type: Object,
          required: true,
          schema: {
            name: { type: String, required: true },
            role: { type: String, required: true },
            background: { type: String, required: true },
          },
        },
      },
      objective: { type: String, required: true },
      PK: { type: String, value: "SCENARIO#${scenarioId}" },
      SK: { type: String, value: "SCENARIO" },
      GS1PK: { type: String, value: "SCENARIO" },
      GS1SK: { type: String, value: "SCENARIO#${created}" },
      created: { type: Date, timestamp: true },
      updated: { type: Date, timestamp: true },
    },
  } as const,
  params: {
    timestamps: true,
    separator: "#",
  },
} satisfies OneSchema;

const table = new Table({
  client,
  schema,
  name: "assert-table",
  partial: true,
});

export type SessionEntity = Entity<typeof schema.models.Session>;
export type ScenarioEntity = Entity<typeof schema.models.Scenario>;
export type SessionParticipantEntity = Entity<
  typeof schema.models.SessionParticipant
>;
export type SessionChannelEntity = Entity<typeof schema.models.SessionChannel>;
export type SessionFeedbackEntity = Entity<
  typeof schema.models.SessionFeedback
>;

export const SessionModel = table.getModel("Session");
export const ScenarioModel = table.getModel("Scenario");
export const SessionParticipantModel = table.getModel("SessionParticipant");
export const SessionChannelModel = table.getModel("SessionChannel");
export const SessionFeedbackModel = table.getModel("SessionFeedback");
