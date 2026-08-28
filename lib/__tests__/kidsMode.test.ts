import { describe, it, expect } from 'vitest';
import { contemTermoAdulto, filtrarConteudoAdulto } from '../kidsMode';
import type { Cinema } from '../types';

function filme(parcial: Partial<Cinema>): Cinema {
  return {
    id: 1,
    titulo: 'Teste',
    description: null,
    tmdb_id: null,
    url: null,
    trailer: null,
    year: null,
    rating: null,
    duration: null,
    duration_seconds: null,
    category: null,
    genre: null,
    type: 'movie',
    poster: null,
    banner: null,
    backdrop: null,
    created_at: '',
    subtitles: null,
    audio_tracks: null,
    elenco: null,
    relacionados: null,
    ...parcial
  };
}

describe('contemTermoAdulto', () => {
  it('identifica "Adulto" na categoria', () => {
    expect(contemTermoAdulto('Adulto')).toBe(true);
    expect(contemTermoAdulto('adulto')).toBe(true);
  });

  it('não marca categorias comuns como adulto', () => {
    expect(contemTermoAdulto('Ação')).toBe(false);
    expect(contemTermoAdulto('Família')).toBe(false);
  });

  it('lida com nulo/vazio sem quebrar', () => {
    expect(contemTermoAdulto(null)).toBe(false);
    expect(contemTermoAdulto('')).toBe(false);
  });
});

describe('filtrarConteudoAdulto', () => {
  it('remove filmes marcados como adulto na categoria ou no gênero', () => {
    const lista = [
      filme({ id: 1, category: 'Ação' }),
      filme({ id: 2, category: 'Adulto' }),
      filme({ id: 3, genre: 'Adulto' }),
      filme({ id: 4, category: 'Comédia' })
    ];
    const resultado = filtrarConteudoAdulto(lista);
    expect(resultado.map((f) => f.id)).toEqual([1, 4]);
  });
});
