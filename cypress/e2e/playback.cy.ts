describe('Fluxo de Reprodução de Vídeo', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
  });

  it('deve iniciar um filme e exibir o player', () => {
    // Clica no primeiro filme da primeira linha
    cy.get('section').first().find('a').first().click();
    cy.contains('Assistir').click();
    
    // Verifica se o player de vídeo (Vidstack) está no DOM
    cy.get('media-player').should('be.visible');
    cy.get('video').should('have.prop', 'paused', false);
  });

  it('deve exibir modal de retomar progresso para conteúdos iniciados', () => {
    // Simula que o usuário já assistiu parte do filme (inserindo no banco via mock ou API)
    // Aqui visitamos um item que sabemos ter progresso
    cy.visit('/detalhes/movie-with-progress');
    cy.contains('Assistir').click();
    
    // Verifica se o modal de "Continuar de onde parei" aparece
    cy.contains('Continuar assistindo?').should('be.visible');
    
    // Clica em retomar e verifica se o tempo de início não é zero
    cy.contains('Continuar de onde parei').click();
    cy.get('media-player').then(($player) => {
      const currentTime = $player[0].currentTime;
      expect(currentTime).to.be.greaterThan(0);
    });
  });
});