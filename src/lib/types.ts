export interface Event {
  id: string;
  code: string;
  title: string;
  admin_token: string;
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  event_id: string;
  content: string;
  like_count: number;
  is_answered: boolean;
  created_at: string;
}

export interface Like {
  id: string;
  question_id: string;
  visitor_id: string;
  created_at: string;
}
