import { describe, it, expect } from 'vitest';
import { categoriasDoTitulo, CATEGORIAS_FILMES } from '../categorias';

describe('categoriasDoTitulo', () => {
  it('reconhece uma única categoria', () => {
    expect(categoriasDoTitulo('Ação')).toEqual(['Ação']);
  });

  it('reconhece múltiplas categorias separadas por vírgula', () => {
    expect(categoriasDoTitulo('Ação, Aventura')).toEqual(['Ação', 'Aventura']);
  });

  it('reconhece categorias separadas por barra, sem espaço', () => {
    expect(categoriasDoTitulo('Ação/Aventura')).toEqual(['Ação', 'Aventura']);
  });

  it('ignora acentos e maiúsculas/minúsculas', () => {
    expect(categoriasDoTitulo('ação')).toEqual(['Ação']);
    expect(categoriasDoTitulo('AÇÃO')).toEqual(['Ação']);
  });

  it('ignora categorias que não existem na lista oficial (nunca inventa uma nova)', () => {
    expect(categoriasDoTitulo('Categoria Inexistente')).toEqual([]);
  });

  it('não repete a mesma categoria duas vezes para o mesmo título', () => {
    expect(categoriasDoTitulo('Ação, ação, AÇÃO')).toEqual(['Ação']);
  });

  it('retorna lista vazia para campo nulo/vazio', () => {
    expect(categoriasDoTitulo(null)).toEqual([]);
    expect(categoriasDoTitulo('')).toEqual([]);
  });

  it('a lista oficial de categorias não tem duplicatas', () => {
    const unicas = new Set(CATEGORIAS_FILMES);
    expect(unicas.size).toBe(CATEGORIAS_FILMES.length);
  });
});
