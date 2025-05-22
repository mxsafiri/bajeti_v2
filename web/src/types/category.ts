export type Category = {
  id: number;
  name: string;
  type: string;
  is_system: boolean | null;
  user_id: number | null;
  created_at: string | null;
};
