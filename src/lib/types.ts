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
  nickname: string | null;
  like_count: number;
  is_answered: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  nickname: string | null;
  like_count: number;
  created_at: string;
}

export interface Like {
  id: string;
  question_id: string | null;
  answer_id: string | null;
  visitor_id: string;
  created_at: string;
}
