import { z } from "zod";

export const normalizedVoterKey = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform((value) => value.normalize("NFKC").toLocaleLowerCase());

export const normalizedEmail = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((value) => value.normalize("NFKC").toLocaleLowerCase());

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const createElectionSchema = z.object({
  workspaceId: z.uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  timeZone: z.string().trim().min(1).max(64).default("Africa/Lagos"),
  opensAt: z.iso.datetime({ offset: true }).optional(),
  closesAt: z.iso.datetime({ offset: true }).optional(),
}).refine((value) => {
  if (!value.opensAt || !value.closesAt) return true;
  return new Date(value.opensAt) < new Date(value.closesAt);
}, { message: "Closing time must be after opening time", path: ["closesAt"] });

export const importRowSchema = z.object({
  voter_key: normalizedVoterKey,
  email: z.union([z.string().trim().max(254).email().transform((value) => value.normalize("NFKC").toLocaleLowerCase()), z.literal("")]).optional(),
  display_name: z.string().trim().max(120).optional(),
});

export const voterImportSchema = z.object({
  batchKey: z.uuid(),
  rows: z.array(importRowSchema).min(1).max(1000),
});
