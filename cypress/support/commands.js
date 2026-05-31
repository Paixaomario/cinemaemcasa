// Commands customizados para Cypress

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button').contains(/login|entrar/i).click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('logout', () => {
  cy.get('button, a').contains(/logout|sair/i).click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('searchFor', (query) => {
  cy.visit('/search');
  cy.get('input[type="text"]').type(query);
  cy.get('button').contains(/buscar|search/i).click();
  cy.url().should('include', `q=${query}`);
});

Cypress.Commands.add('navigateTo', (page) => {
  const pages = {
    home: '/',
    search: '/search',
    movies: '/filmes',
    series: '/series',
    favorites: '/favoritos',
    profile: '/perfil',
  };
  cy.visit(pages[page] || pages.home);
});

Cypress.Commands.add('clickSuggestion', (index = 0) => {
  cy.get('[role="option"]').eq(index).click();
});

Cypress.Commands.add('typeWithAutocomplete', (text, selectFirst = true) => {
  cy.get('input[type="text"]').type(text);
  cy.get('[role="listbox"]').should('be.visible');
  if (selectFirst) {
    cy.get('[role="option"]').first().click();
  }
});

Cypress.Commands.add('checkContentCard', () => {
  cy.get('[data-testid="content-card"], article').should('be.visible');
  cy.get('[data-testid="content-card"] img, article img').should('have.attr', 'src');
});
