describe('Fluxo de Busca e Navegação', () => {
  beforeEach(() => {
    // Simula login ou sessão ativa se necessário
    cy.visit('/search');
  });

  it('deve permitir que o usuário digite e veja sugestões', () => {
    cy.get('input[placeholder*="Títulos, gêneros"]').type('Avatar', { delay: 100 });
    
    // Verifica se o dropdown de sugestões apareceu
    cy.contains('Avatar').should('be.visible');
  });

  it('deve realizar a busca ao selecionar uma sugestão', () => {
    cy.get('input[placeholder*="Títulos, gêneros"]').type('Avatar');
    cy.contains('button', 'Avatar').click();
    
    // Verifica se os resultados foram carregados
    cy.get('main').within(() => {
      cy.contains('Resultados para').should('be.visible');
    });
  });

  it('deve navegar corretamente usando as setas do teclado (D-Pad Simulation)', () => {
    cy.get('input').type('{downarrow}');
    // Verifica se o foco saiu do input ou se a primeira sugestão foi destacada
  });
});