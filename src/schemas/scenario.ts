import { z } from "zod";

export const scenarioSchema = z.object({
  corporate: z.object({
    company_name: z.string().min(1, "Company name is required"),
    company_history: z.string().min(1, "Company history is required"),
    current_project: z.string().min(
      1,
      "Current project description is required",
    ),
  }),
  challenge: z.string().min(1, "Challenge description is required"),
  characters: z.array(
    z.object({
      role: z.string().min(1, "Character role is required"),
      background: z.string().min(1, "Character background is required"),
      ace: z.string().min(1, "Character ace is required"),
    }),
  ).length(4, "Exactly 4 characters are required"),
  npcs: z.array(
    z.object({
      name: z.string().min(1, "NPC name is required"),
      role: z.string().min(1, "NPC role is required"),
      background: z.string().min(1, "NPC background is required"),
    }),
  ).min(1, "At least 1 NPC is required"),
  objective: z.string().min(1, "Objective is required"),
});
