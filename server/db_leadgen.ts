import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";

/**
 * Update farmer profile from flow slots (only fields with saveToProfile=true).
 */
export async function upsertFarmerProfileFromSlots(data: {
  farmerProfileId: string;
  slots: Record<string, unknown>;
  flow: { slots: Array<{ key: string; saveToProfile?: boolean; profileField?: string }> };
}): Promise<void> {
  const db = await getDb();
  const { farmerProfiles } = await import("../drizzle/schema");

  // Build updates object from slots that have saveToProfile=true
  const updates: Record<string, unknown> = {};

  for (const slot of data.flow.slots) {
    if (!slot.saveToProfile || !slot.profileField) {
      continue;
    }

    const slotValue = data.slots[slot.key];
    if (slotValue !== undefined && slotValue !== null && slotValue !== '') {
      // Map slot value to profile field (simple 1:1 mapping)
      updates[slot.profileField] = slotValue;
    }
  }

  if (Object.keys(updates).length === 0) {
    return; // Nothing to update
  }

  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  if (Object.keys(cleanUpdates).length === 0) {
    return;
  }

  // Update farmer profile
  await db
    .update(farmerProfiles)
    .set(cleanUpdates)
    .where(eq(farmerProfiles.farmerProfileId, data.farmerProfileId));
}

/**
 * Create a lead session (public access).
 * Note: Uses userId=0 for conversations since userId is NOT NULL.
 * In production, consider making userId nullable or using a system user ID.
 */
export async function createLeadSession(data: {
  audience: 'loan_officer' | 'farmer';
  dialect?: string;
  landingPath?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}): Promise<{
  sessionToken: string;
  leadId: number;
  conversationId: number;
  farmerProfileId: string;
}> {
  const db = await getDb();
  const { kaaniLeads, conversations, farmerProfiles } = await import("../drizzle/schema");

  // Generate cryptographically strong session token (64 hex chars = 256 bits)
  const sessionToken = randomBytes(32).toString('hex');

  // Create farmer profile (no userId for public sessions)
  const farmerProfileId = randomUUID();
  
  await db.insert(farmerProfiles).values({
    farmerProfileId,
    createdByUserId: null,
  });

  // Create conversation (userId=0 for public sessions - placeholder)
  // TODO: Consider making userId nullable in schema or using system user ID
  const conversationResult = await db.insert(conversations).values({
    userId: 0, // Placeholder for public sessions
    title: 'Lead Session',
    farmerProfileId,
  });

  const conversationId = Number(conversationResult[0].insertId);

  // Insert lead record
  const leadResult = await db.insert(kaaniLeads).values({
    source: 'public',
    audience: data.audience,
    dialect: data.dialect || null,
    conversationId,
    farmerProfileId,
    sessionToken,
    landingPath: data.landingPath || null,
    utmSource: data.utm?.source || null,
    utmMedium: data.utm?.medium || null,
    utmCampaign: data.utm?.campaign || null,
  });

  return {
    sessionToken,
    leadId: Number(leadResult[0].insertId),
    conversationId,
    farmerProfileId,
  };
}

/**
 * Get lead by session token.
 */
export async function getLeadBySessionToken(sessionToken: string): Promise<{
  id: number;
  audience: 'loan_officer' | 'farmer';
  conversationId: number | null;
  farmerProfileId: string | null;
} | null> {
  const db = await getDb();
  const { kaaniLeads } = await import("../drizzle/schema");

  const [lead] = await db
    .select({
      id: kaaniLeads.id,
      audience: kaaniLeads.audience,
      conversationId: kaaniLeads.conversationId,
      farmerProfileId: kaaniLeads.farmerProfileId,
    })
    .from(kaaniLeads)
    .where(eq(kaaniLeads.sessionToken, sessionToken))
    .limit(1);

  return lead || null;
}

/**
 * Update lead with captured information.
 */
export async function attachLeadCapture(
  leadId: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    consentObtained?: boolean;
    consentTextVersion?: string;
  }
): Promise<void> {
  const db = await getDb();
  const { kaaniLeads } = await import("../drizzle/schema");

  const updates: Record<string, unknown> = {};
  
  if (data.name !== undefined) updates.capturedName = data.name;
  if (data.email !== undefined) updates.capturedEmail = data.email;
  if (data.phone !== undefined) updates.capturedPhone = data.phone;
  if (data.consentObtained !== undefined) {
    updates.consentObtained = data.consentObtained ? 1 : 0;
    if (data.consentObtained) {
      updates.consentTimestamp = new Date().toISOString();
    }
  }
  if (data.consentTextVersion !== undefined) updates.consentTextVersion = data.consentTextVersion;

  if (Object.keys(updates).length === 0) {
    return;
  }

  await db
    .update(kaaniLeads)
    .set(updates)
    .where(eq(kaaniLeads.id, leadId));
}



