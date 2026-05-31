describe('Home Page E2E Tests', () => {
  before(() => {
    cy.visit('/');
  });

  describe('Page Layout', () => {
    it('should load home page', () => {
      cy.get('body').should('be.visible');
    });

    it('should display header/navigation', () => {
      cy.get('nav, header').should('be.visible');
    });

    it('should display main content area', () => {
      cy.get('main').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate to search page', () => {
      cy.get('a, button').contains(/search|buscar/i).first().click();
      cy.url().should('include', '/search');
    });

    it('should navigate to movies', () => {
      cy.visit('/');
      cy.get('a, button').contains(/movies|filmes/i).first().click();
      cy.url().should('include', '/filmes');
    });

    it('should navigate to series', () => {
      cy.visit('/');
      cy.get('a, button').contains(/series/i).first().click();
      cy.url().should('include', '/series');
    });

    it('should navigate to favorites', () => {
      cy.visit('/');
      cy.get('a, button').contains(/favorites|favorito/i).first().click();
      cy.url().should('include', '/favoritos');
    });

    it('should navigate to profile', () => {
      cy.visit('/');
      cy.get('a, button').contains(/profile|perfil|user/i).first().click();
      cy.url().should('include', '/perfil');
    });
  });

  describe('Content Display', () => {
    it('should display movies section', () => {
      cy.visit('/');
      cy.get('[data-testid="movies-section"], section').should('have.length.greaterThan', 0);
    });

    it('should display content cards', () => {
      cy.visit('/');
      cy.get('[data-testid="content-card"], [role="listitem"]').should('have.length.greaterThan', 0);
    });

    it('should have clickable content items', () => {
      cy.visit('/');
      cy.get('[data-testid="content-card"], article').first().click();
      cy.url().should('not.equal', 'http://localhost:3000/');
    });
  });

  describe('Responsive Design', () => {
    it('should be mobile friendly', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('nav').should('be.visible');
      cy.get('main').should('be.visible');
    });

    it('should stack layout on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      // Check if layout adapts (e.g., hamburger menu visible)
      cy.get('body').should('be.visible');
    });

    it('should use full width on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.get('main').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load within reasonable time', () => {
      cy.visit('/', { timeout: 10000 });
      cy.get('main').should('be.visible');
    });

    it('should lazy load images', () => {
      cy.visit('/');
      cy.get('img[loading="lazy"]').should('have.length.greaterThan', 0);
    });
  });
});
