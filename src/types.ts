export interface Comment {
  id: number;
  post_id: number;
  author: string;
  text: string;
  created_at?: string;
}

export interface Post {
  id: number;
  author: string;
  title: string;
  content: string;
  status: string;
  location: string;
  category: string;
  image_url: string;
  likes: number;
  comments: Comment[];
  created_at: string;
}

export interface Prediction {
  className: string;
  probability: number;
}

export type TabType = 'analyzer' | 'board' | 'stats' | 'leaderboard';

export type Category = '녹화' | '쿨루프' | '바닥재' | '바람길' | '기타';

export const CATEGORIES: Category[] = ['녹화', '쿨루프', '바닥재', '바람길', '기타'];

export const LOCATIONS = [
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8',
  '2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9',
  '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9',
  '농구장', '운동장', '강당',
] as const;

export type LocationType = typeof LOCATIONS[number];
