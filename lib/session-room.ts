export const TABLE_CLOSED_MESSAGE = "This table is closed. Ask the session lead if you should be here.";
export const TABLE_LOCK_SQL_MESSAGE = "Run supabase/migrations/20261020120000_session_joining.sql in the Supabase SQL editor, then try again.";

export function tableAcceptsNewCuppers(joiningOpen: boolean | null | undefined) {
  return joiningOpen !== false;
}

export function canJoinTable(joiningOpen: boolean | null | undefined, alreadyOnSheet: boolean) {
  return alreadyOnSheet || tableAcceptsNewCuppers(joiningOpen);
}
