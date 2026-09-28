export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SessionRecord = {
  id: string;
  event_id: string;
  name: string;
  category: string;
  slug: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CoffeeLot = {
  id: string;
  session_id: string;
  lot_name: string;
  lot_number: string | null;
  cupping_code: string | null;
  washing_station: string | null;
  district: string | null;
  country: string | null;
  variety: string | null;
  process: string | null;
  altitude: string | null;
  harvest: string | null;
  producer: string | null;
  cooperative: string | null;
  description: string | null;
  photo_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  country: string;
  organization: string | null;
  role: string | null;
  created_at: string;
};

export type ParticipantSession = {
  id: string;
  participant_id: string;
  session_id: string;
  started_at: string;
  completed_at: string | null;
  status: "in_progress" | "completed";
  resume_token: string;
};

export type EvaluationRecord = {
  id: string;
  participant_session_id: string;
  participant_id: string;
  session_id: string;
  coffee_lot_id: string;
  aroma_score: number;
  flavor_score: number;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
};
