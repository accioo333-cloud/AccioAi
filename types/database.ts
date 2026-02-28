export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentCard {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  tags: string[];
  created_at: string;
}

export interface UserInteraction {
  id: string;
  user_id: string;
  card_id: string;
  interaction_type: "view" | "like" | "bookmark" | "complete";
  created_at: string;
}

export interface ContentSource {
  id: string;
  name: string;
  source_type: "rss" | "api" | "manual";
  source_url: string;
  category: string;
  is_active: boolean;
  fetch_frequency_hours: number;
  last_fetched_at: string | null;
  created_at: string;
}

export interface RawContent {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  published_at: string;
  processed: boolean;
  created_at: string;
}

export interface AutomationRun {
  id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  items_fetched: number;
  items_processed: number;
  error_message: string | null;
}
