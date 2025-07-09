export interface Wall {
  id: string;
  name: string;
  theme_color: string;
  cover_photo_url?: string;
  host_user_id?: string;
  created_at: string;
  expires_at: string;
  is_paid: boolean;
  max_memories: number;
  is_active: boolean;
}

export interface Memory {
  id: string;
  wall_id: string;
  type: 'text' | 'sketch' | 'image' | 'gif' | 'video';
  content?: string;
  media_url?: string;
  media_type?: string;
  author_name: string;
  author_fingerprint?: string;
  created_at: string;
  updated_at: string;
  reactions?: Reaction[];
  comments?: Comment[];
}

export interface Reaction {
  id: string;
  memory_id: string;
  emoji: string;
  author_fingerprint: string;
  created_at: string;
}

export interface Comment {
  id: string;
  memory_id: string;
  content: string;
  author_name: string;
  author_fingerprint?: string;
  created_at: string;
}