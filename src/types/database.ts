export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string | null; full_name: string | null; avatar_url: string | null; is_admin: boolean; created_at: string; updated_at: string }
        Insert: { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; is_admin?: boolean }
        Update: { username?: string | null; full_name?: string | null; avatar_url?: string | null; is_admin?: boolean; updated_at?: string }
      }
      content: {
        Row: { id: string; title: string; description: string | null; type: 'movie' | 'series' | 'episode'; genre: string[]; categories: string[]; thumbnail_url: string | null; backdrop_url: string | null; video_url: string | null; trailer_url: string | null; duration_seconds: number | null; year: number | null; rating: string | null; cast_names: string[]; director: string | null; parent_id: string | null; season_number: number | null; episode_number: number | null; is_published: boolean; is_featured: boolean; views_count: number; created_at: string; updated_at: string }
        Insert: { title: string; type: 'movie' | 'series' | 'episode'; description?: string | null; genre?: string[]; categories?: string[]; thumbnail_url?: string | null; backdrop_url?: string | null; video_url?: string | null; trailer_url?: string | null; duration_seconds?: number | null; year?: number | null; rating?: string | null; cast_names?: string[]; director?: string | null; parent_id?: string | null; season_number?: number | null; episode_number?: number | null; is_published?: boolean; is_featured?: boolean }
        Update: Partial<Database['public']['Tables']['content']['Insert']>
      }
      home_sections: {
        Row: { id: string; title: string; layout: 'hero' | 'row' | 'row_wide' | 'grid' | 'live'; content_types: string[]; genres: string[]; categories: string[]; order_by: 'created_at_desc' | 'views_desc' | 'year_desc' | 'title_asc'; item_limit: number; position: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { title: string; layout?: 'hero' | 'row' | 'row_wide' | 'grid' | 'live'; content_types?: string[]; genres?: string[]; categories?: string[]; order_by?: 'created_at_desc' | 'views_desc' | 'year_desc' | 'title_asc'; item_limit?: number; position?: number; is_active?: boolean }
        Update: Partial<Database['public']['Tables']['home_sections']['Insert']>
      }
      lives: {
        Row: { id: string; title: string; description: string | null; stream_url: string; thumbnail_url: string | null; is_live: boolean; scheduled_at: string | null; created_by: string; created_at: string }
        Insert: { title: string; stream_url: string; description?: string | null; thumbnail_url?: string | null; is_live?: boolean; scheduled_at?: string | null; created_by: string }
        Update: Partial<Database['public']['Tables']['lives']['Insert']>
      }
      watch_history: {
        Row: { id: string; user_id: string; content_id: string; progress_seconds: number; completed: boolean; watched_at: string }
        Insert: { user_id: string; content_id: string; progress_seconds?: number; completed?: boolean }
        Update: { progress_seconds?: number; completed?: boolean; watched_at?: string }
      }
      favorites: {
        Row: { id: string; user_id: string; content_id: string; created_at: string }
        Insert: { user_id: string; content_id: string }
        Update: never
      }
    }
  }
}

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Content      = Database['public']['Tables']['content']['Row']
export type HomeSection  = Database['public']['Tables']['home_sections']['Row']
export type Live         = Database['public']['Tables']['lives']['Row']
export type WatchHistory = Database['public']['Tables']['watch_history']['Row']
export type Favorite     = Database['public']['Tables']['favorites']['Row']

export interface HomeSectionWithContent extends HomeSection { items: Content[] }
