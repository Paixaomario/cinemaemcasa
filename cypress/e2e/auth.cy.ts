describe('Fluxo de Autenticação', () => {
  it('deve redirecionar usuário não logado para /login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('deve permitir login com credenciais válidas', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@cinemaemcasa.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Deve ir para a home após login
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('Destaques').should('be.visible');
  });

  it('deve permitir logout e limpar a sessão', () => {
    cy.login(); // Comando customizado simulando sessão
    cy.visit('/perfil');
    cy.contains('Sair').click();
    cy.url().should('include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'supabase.auth.token').should('be.null');
  });
});