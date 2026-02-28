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
