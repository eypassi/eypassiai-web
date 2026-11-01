import { createClient } from "@supabase/supabase-js";
import type { AiRequestApproval } from "./ai-consent";

type AccountSession = { user: { id: string }; access_token: string };
type ProposalContext = { properties: Array<{ id: string; user_id: string }>; categories: string[] };
type ProposalDependencies = {
  getSession: () => Promise<{ data: { session: AccountSession | null }; error?: unknown }>;
  supabaseUrl: string;
  supabaseAnonKey: string;
  fetch?: typeof globalThis.fetch;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Der KI-Vorschlag hat kein gültiges Format.");
  return value as Record<string, unknown>;
}
function finite(value: unknown, label: string, minimum = -1e12) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > 1e12) throw new Error(`${label} ist ungültig.`);
  return value;
}
function text(value: unknown, label: string, max = 2000) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${label} ist ungültig.`);
  return value.trim();
}

export function buildAiProposal(accountId: string, proposal: unknown, context: ProposalContext): { table: string; payload: Record<string, unknown> } {
  const item = record(proposal);
  const data = record(item.data);
  const date = text(data.date, "Datum", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Das Datum des KI-Vorschlags ist ungültig.");
  let propertyId: string | null = null;
  if (data.property_id !== undefined && data.property_id !== null && data.property_id !== "") {
    propertyId = text(data.property_id, "Objektkennung", 100);
    if (!context.properties.some(property => property.id === propertyId && property.user_id === accountId)) throw new Error("Das vorgeschlagene Objekt gehört nicht zu deinen aktuell geladenen Objekten.");
  }
  if (item.action_type === "create_transaction") {
    const category = text(data.category, "Kategorie", 100);
    if (!context.categories.includes(category)) throw new Error("Die vorgeschlagene Kategorie ist nicht verfügbar.");
    return { table: "transactions", payload: {
      amount: finite(data.amount, "Betrag"), category, date, property_id: propertyId,
      notes: data.notes === undefined || data.notes === null || data.notes === "" ? null : text(data.notes, "Notiz"),
      is_verified: false, import_source: "web_agent", user_id: accountId,
    } };
  }
  if (item.action_type === "create_travel_expense") {
    return { table: "travel_expenses", payload: { km: finite(data.km, "Kilometer", 0), purpose: text(data.purpose, "Fahrtzweck"), date, property_id: propertyId, user_id: accountId } };
  }
  throw new Error("Diese KI-Aktion wird nicht unterstützt.");
}

function failure(error: unknown) {
  return error instanceof Error ? error : new Error(typeof (error as { message?: unknown })?.message === "string" ? (error as { message: string }).message : "Der Vorschlag konnte nicht gespeichert werden.");
}

export function createAiProposalApplier(dependencies: ProposalDependencies) {
  const transport = dependencies.fetch ?? globalThis.fetch.bind(globalThis);
  return async (accountId: string, proposal: unknown, context: ProposalContext, approval: AiRequestApproval | null) => {
    try {
      if (!approval?.isCurrent()) throw new Error("Die KI-Freigabe ist nicht mehr gültig.");
      const prepared = buildAiProposal(accountId, proposal, context);
      const { data: { session }, error } = await dependencies.getSession();
      if (error || !session || session.user.id !== accountId || !session.access_token) throw new Error("Das angemeldete Konto hat sich geändert. Bitte prüfe die Anmeldung.");
      if (!approval.isCurrent()) throw new Error("Die KI-Freigabe ist nicht mehr gültig.");
      const client = createClient(dependencies.supabaseUrl, dependencies.supabaseAnonKey, {
        accessToken: async () => session.access_token,
        global: { fetch: (input, init) => {
          if (!approval.isCurrent()) return Promise.reject(new DOMException("KI-Freigabe nicht mehr gültig", "AbortError"));
          const headers = new Headers(init?.headers);
          headers.set("Authorization", `Bearer ${session.access_token}`);
          return transport(input, { ...init, headers, signal: approval.signal });
        } },
      });
      const result = await client.from(prepared.table).insert(prepared.payload);
      if (result.error) throw result.error;
      return { error: null };
    } catch (error) { return { error: failure(error) }; }
    finally { approval?.release(); }
  };
}
