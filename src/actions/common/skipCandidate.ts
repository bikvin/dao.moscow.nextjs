"use server";

import { db } from "@/db";
import { SkippedCandidateSource } from "@prisma/client";

// Marks an import candidate as manually handled so it no longer appears in the active
// candidates list. label is a human-readable description shown in the skipped tab.
export async function skipCandidate(
  source: SkippedCandidateSource,
  externalId: string,
  label: string
): Promise<void> {
  await db.skippedCandidate.upsert({
    where: { source_externalId: { source, externalId } },
    update: {},
    create: { source, externalId, label },
  });
}

// Removes a candidate from the skipped list so it re-appears in the active candidates
// on the next fetch.
export async function unskipCandidate(
  source: SkippedCandidateSource,
  externalId: string
): Promise<void> {
  await db.skippedCandidate.deleteMany({ where: { source, externalId } });
}
