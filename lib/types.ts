// Tipos espelhando as tabelas reais do Supabase.
// Nenhuma tabela ou coluna aqui deve ser modificada no banco — apenas lida.

export interface Cinema {
  id: number;
  titulo: string;
  description: string | null;
  tmdb_id: number | null;
  url: string | null;
  trailer: string | null;
  year: number | null;
  rating: number | null;
  duration: string | null;
  duration_seconds: number | null;
  category: string | null;
  genre: string | null;
  type: 'movie' | 'series' | string;
  poster: string | null;
  banner: string | null;
  backdrop: string | null;
  created_at: string;
  subtitles: { lang: string; url: string }[] | null;
  audio_tracks: { lang: string; url?: string }[] | null;
  elenco: { nome: string; personagem?: string; foto?: string }[] | null;
  relacionados: number[] | null;
}

export interface Serie {
  id_n: number;
  titulo: string | null;
  descricao: string | null;
  ano: number | null;
  tmdb_id: number | null;
  capa: string | null;
  banner: string | null;
  trailer: string | null;
  genero: string | null;
  classificacao: string | null;
  rating: number | null;
  poster: string | null;
  tmdb_runtime: string | null;
  elenco: { nome: string; personagem?: string; foto?: string }[] | null;
  relacionados: number[] | null;
}

export interface Temporada {
  id_n: number;
  serie_id: number | null;
  numero_temporada: number | null;
  capa: string | null;
  banner: string | null;
  titulo: string | null;
  ano: number | null;
}

export interface Episodio {
  id_n: number;
  temporada_id: number | null;
  numero_episodio: number | null;
  titulo: string | null;
  descricao: string | null;
  duracao: string | null;
  arquivo: string | null;
  imagem_185: string | null;
  imagem_342: string | null;
  imagem_500: string | null;
  banner: string | null;
  trailer: string | null;
  subtitles: { lang: string; url: string }[] | null;
  audio_tracks: { lang: string; url?: string }[] | null;
  tmdb_id: number | null;
  poster: string | null;
  capa: string | null;
  tmd_id_ref: number | null;
}

export interface HomeSection {
  id: string;
  titulo: string;
  categorias: string[];
  fonte: 'cinema' | 'tmdb';
  tmdb_endpoint: string | null;
  layout: 'row' | 'grid' | 'featured';
  limite: number;
  ordenacao: 'created_at_desc' | 'rating_desc' | 'year_desc' | 'random';
  posicao: number;
  ativo: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  system_avatar_id: number | null;
  pin_code: string | null;
  is_child: boolean;
  content_rating_limit: string;
}

export interface ParentalControl {
  user_id: string;
  pin_hash: string | null;
  max_rating: string;
  block_adult_content: boolean;
  enabled: boolean;
}

export interface PartyRoom {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series' | string;
  host_id: string;
  is_active: boolean;
  started_at: string | null;
}

export interface PartyMessage {
  id: string;
  room_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface ViewProgress {
  user_id: string;
  content_id: string;
  last_position: number;
  is_finished: boolean;
}

export interface Recommendation {
  user_id: string;
  content_id: string;
  score: number | null;
  reason: string | null;
  viewed: boolean;
}

export interface SearchCatalogItem {
  id: number;
  source_table: string;
  source_id: number;
  tipo: string;
  titulo: string | null;
  descricao: string | null;
  genero: string | null;
  ano: number | null;
  poster: string | null;
  banner: string | null;
  url: string | null;
}
