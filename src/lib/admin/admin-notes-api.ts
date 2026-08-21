import { supabase } from "@/integrations/supabase/client";

export const COACH_NOTE_MAX_LENGTH = 8000;

export function isValidCoachNoteBody(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.length >= 1 && trimmed.length <= COACH_NOTE_MAX_LENGTH;
}

export type AdminCoachNote = {
  id: string;
  clientId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export async function listAdminClientNotes(
  clientId: string,
  opts?: { includeArchived?: boolean },
): Promise<AdminCoachNote[]> {
  const { data, error } = await supabase.rpc("admin_list_client_notes", {
    p_client_id: clientId,
    p_limit: 50,
    p_offset: 0,
    p_include_archived: opts?.includeArchived ?? false,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? null,
  }));
}

export async function addAdminClientNote(clientId: string, body: string): Promise<void> {
  if (!isValidCoachNoteBody(body)) {
    throw new Error("invalid_note_body");
  }
  const { error } = await supabase.rpc("admin_add_client_note", {
    p_client_id: clientId,
    p_body: body.trim(),
  });
  if (error) throw error;
}

export async function archiveAdminClientNote(noteId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_archive_client_note", { p_note_id: noteId });
  if (error) throw error;
}
