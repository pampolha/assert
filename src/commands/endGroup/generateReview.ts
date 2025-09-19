import { OpenAI } from "openai";
import {
  type ReviewChannelHistoryMessage,
  reviewSchema,
} from "../../schemas/review.ts";
import {
  type ScenarioEntity,
  SessionFeedbackModel,
  SessionReviewModel,
} from "../../table/models.ts";
import z from "zod";
import { openrouterKey } from "../../env.ts";

const systemPrompt = `1. REVIEW OBJECTIVE:
Generate a honest evaluation of a corporate role-playing session that simulates intense IT team dynamics under extreme pressures. The review must assess participants' performance in handling ethical dilemmas, maintaining composure, and using assertive communication while navigating ruthless corporate demands.

2. EVALUATION CRITERIA:
Consider the following aspects with uncompromising realism:

   Assertive Communication:
      - Clarity and confidence in expressing positions under pressure
      - Ability to respectfully challenge unreasonable demands
      - Effectiveness in negotiating compromises while maintaining professional boundaries
      - Use of persuasive arguments backed by factual information

   Composure Under Pressure:
      - Maintenance of professional demeanor during conflicts and high-stakes situations
      - Resistance to intimidation and aggressive tactics
      - Emotional regulation when facing ethical compromises and corporate savagery

   Ethical Decision-Making:
      - Handling of moral dilemmas between profit, ethics, and personal integrity
      - Consideration of long-term consequences vs short-term gains
      - Balancing company loyalty with personal and professional values

   Strategic Problem-Solving:
      - Effectiveness in navigating complex stakeholder interests
      - Utilization of character backgrounds and "ace" information to support arguments
      - Collaboration skills in reaching workable solutions amid conflicting objectives

   Role Adherence:
      - Consistency with assigned professional role and background
      - Appropriateness of responses based on character knowledge and motivations

3. OUTPUT FORMAT:
The response shall be a valid JSON object with exactly these attributes:

   overallEvaluation: String, a comprehensive assessment of the session's success, including how well participants handled corporate pressures, ethical dilemmas, and communication challenges. Highlight key moments that demonstrated exceptional skill or critical failures.

   feedbacks: Array of Objects (one for each participant), each containing:
        userId: String, the unique identifier for the participant as present in the message history
        content: String, a detailed analysis of the participant's performance, including specific strengths and areas for improvement. Focus on their communication style, decision-making process, and adherence to their role's background and secrets.

4. NOTE ON BOT MESSAGES:
   Some messages in the conversation history are from bots (marked as 'is bot?: true'). These messages are part of the scenario setup and should not be evaluated as participant performance. 
   However, they provide important context for understanding the participants' responses. Only generate feedback for real participants (those with 'is bot?: false'). 
   The feedbacks array must only include entries for real participants.

5. REVIEW PHILOSOPHY:
Draw inspiration from real-world corporate dynamics and high-stakes business environments. The evaluation should be brutally honest yet constructive, highlighting both successes and failures in navigating the harsh realities presented in the scenario. Focus on developmental feedback that helps participants improve their professional communication and ethical decision-making skills under extreme pressure.

6. FINAL INSTRUCTION:
Maintain strict adherence to the JSON output format. The review must be delivered in Brazilian Portuguese, using appropriate corporate terminology and professional language.` as const;

export const generateReview = async (
  conversationHistory: ReviewChannelHistoryMessage[],
  scenario: ScenarioEntity,
  sessionId: string,
  router = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openrouterKey,
  }),
) => {
  const formattedHistory = conversationHistory.map((msg) =>
    `${msg.userId} (is bot?: ${msg.isBot}) said: "${msg.content}"`
  ).join("\n");

  const reviewResponse = await router.chat.completions.create({
    model: "tngtech/deepseek-r1t2-chimera:free",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          `Scenario: ${scenario}\nConversation history:${formattedHistory}\n\oReview:`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        schema: z.toJSONSchema(reviewSchema),
        name: "review",
      },
    },
  });

  const reviewContent = reviewResponse.choices[0].message?.content;

  if (!reviewContent) {
    throw new Error("Generated review is empty.");
  }

  const reviewData = JSON.parse(reviewContent);
  const parsedContent = reviewSchema.parse(reviewData);

  await Promise.all([
    SessionReviewModel.create({
      sessionId,
      overallEvaluation: parsedContent.overallEvaluation,
    }),
    ...parsedContent.feedbacks.map((feedback) =>
      SessionFeedbackModel.create({
        sessionId,
        feedbackGiverId: "Assert",
        feedbackReceiverId: feedback.userId,
        feedbackText: feedback.content,
      })
    ),
  ]);

  return parsedContent;
};
