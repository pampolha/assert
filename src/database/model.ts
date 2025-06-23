import {model, Schema } from "dynamoose";

const schema = new Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },
    SK: {
      type: String,
      rangeKey: true,
    },
    type: {
      type: String,
      index: {
        name: "type-index",
      },
    },
  },
  {
    saveUnknown: true,
    timestamps: true,
  },
);

export const AssertModel = model("assert-table", schema);
