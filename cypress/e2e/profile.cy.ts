describe('Fluxo de Perfil e Configurações', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/perfil');
  });

  it('deve alterar e persistir o tamanho da legenda', () => {
    cy.contains('Acessibilidade').click();
    cy.get('select[name="subtitleSize"]').select('Extra Grande');
    
    // Recarrega para garantir persistência no Supabase
    cy.reload();
    cy.get('select[name="subtitleSize"]').should('have.value', 'extra-large');
  });

  it('deve ativar o Modo Infantil e filtrar a home', () => {
    cy.get('button').contains('Modo Infantil').click();
    cy.visit('/');
    
    // Verifica se seções de terror/adulto foram removidas (Baseado na lógica isChild)
    cy.contains('Terror').should('not.exist');
    cy.contains('Suspense Adulto').should('not.exist');
  });
});