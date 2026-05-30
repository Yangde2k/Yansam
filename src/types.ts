export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MoodKind =
  | 'happy'
  | 'calm'
  | 'lonely'
  | 'stressed'
  | 'excited'
  | 'tired'
  | 'sad'
  | 'grateful';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          partner_id: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          email?: string | null;
          partner_id?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      couple_spaces: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          anniversary_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id?: string | null;
          anniversary_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['couple_spaces']['Insert']>;
      };
      partner_invites: {
        Row: {
          id: string;
          code: string;
          inviter_id: string;
          invitee_email: string | null;
          couple_space_id: string | null;
          used_by: string | null;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          code?: string;
          inviter_id: string;
          invitee_email?: string | null;
          couple_space_id?: string | null;
          used_by?: string | null;
          expires_at?: string;
          created_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['partner_invites']['Insert']>;
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          body: string;
          mood: MoodKind | null;
          photo_url: string | null;
          music_url: string | null;
          favorite: boolean;
          pinned: boolean;
          archived: boolean;
          memory_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          body: string;
          mood?: MoodKind | null;
          photo_url?: string | null;
          music_url?: string | null;
          favorite?: boolean;
          pinned?: boolean;
          archived?: boolean;
          memory_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      albums: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['albums']['Insert']>;
      };
      photos: {
        Row: {
          id: string;
          album_id: string;
          couple_id: string;
          url: string;
          favorite: boolean;
          created_at: string;
          updated_at: string;
          position: number;
        };
        Insert: {
          id?: string;
          album_id: string;
          couple_id: string;
          url: string;
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          position?: number;
        };
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
      };
      letters: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          body: string;
          unlock_type: string;
          unlock_date: string | null;
          opened: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          body: string;
          unlock_type?: string;
          unlock_date?: string | null;
          opened?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['letters']['Insert']>;
      };
      milestones: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          date: string;
          type: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          date: string;
          type?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>;
      };
      moods: {
        Row: {
          id: string;
          couple_id: string;
          mood: MoodKind;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          mood: MoodKind;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['moods']['Insert']>;
      };
      wishes: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          kind: string;
          done: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          kind?: string;
          done?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['wishes']['Insert']>;
      };
      special_pages: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          body: string;
          type: string;
          reveal_label: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          body: string;
          type?: string;
          reveal_label?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['special_pages']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          couple_id: string;
          type: string;
          message: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          type: string;
          message?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      shared_notes: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shared_notes']['Insert']>;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type CoupleSpace = Database['public']['Tables']['couple_spaces']['Row'];
export type PartnerInvite = Database['public']['Tables']['partner_invites']['Row'];
export type Memory = Database['public']['Tables']['memories']['Row'] & { photo_src?: string | null; music_src?: string | null };
export type Album = Database['public']['Tables']['albums']['Row'] & {
  photos?: Photo[];
  cover_src?: string | null;
};
export type Photo = Database['public']['Tables']['photos']['Row'] & { src?: string | null };
export type Letter = Database['public']['Tables']['letters']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type MoodLog = Database['public']['Tables']['moods']['Row'];
export type Wish = Database['public']['Tables']['wishes']['Row'];
export type SpecialPage = Database['public']['Tables']['special_pages']['Row'];
export type NotificationItem = Database['public']['Tables']['notifications']['Row'];

export const MOOD_OPTIONS: { value: MoodKind; label: string; emoji: string; color: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊', color: 'from-amber-100 to-amber-200' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: 'from-sky-100 to-cyan-200' },
  { value: 'lonely', label: 'Lonely', emoji: '🥺', color: 'from-violet-100 to-violet-200' },
  { value: 'stressed', label: 'Stressed', emoji: '😵‍💫', color: 'from-orange-100 to-red-200' },
  { value: 'excited', label: 'Excited', emoji: '🤍', color: 'from-pink-100 to-rose-200' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: 'from-stone-100 to-stone-200' },
  { value: 'sad', label: 'Sad', emoji: '💧', color: 'from-blue-100 to-blue-200' },
  { value: 'grateful', label: 'Grateful', emoji: '✨', color: 'from-emerald-100 to-teal-200' },
];