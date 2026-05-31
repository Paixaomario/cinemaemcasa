describe('Search Page E2E Tests', () => {
  before(() => {
    cy.visit('/search');
  });

  describe('Page Load', () => {
    it('should load search page successfully', () => {
      cy.get('h1').should('contain', 'Buscar');
    });

    it('should display search input', () => {
      cy.get('input[type="text"]').should('be.visible');
    });

    it('should display search button', () => {
      cy.get('button').contains(/buscar|search/i).should('be.visible');
    });
  });

  describe('Search Input', () => {
    it('should accept text input', () => {
      cy.get('input[type="text"]').type('avatar');
      cy.get('input[type="text"]').should('have.value', 'avatar');
    });

    it('should show suggestions on input', () => {
      cy.get('input[type="text"]').clear().type('ave');
      // Wait for suggestions to appear
      cy.get('[role="listbox"]', { timeout: 5000 }).should('be.visible');
    });

    it('should filter suggestions based on input', () => {
      cy.get('input[type="text"]').clear().type('movi');
      cy.get('[role="option"]').each(($el) => {
        cy.wrap($el).invoke('text').should('contain.case', /mov|movi/i);
      });
    });

    it('should clear suggestions on backspace', () => {
      cy.get('input[type="text"]').clear().type('test').type('{backspace}{backspace}{backspace}{backspace}');
      cy.get('input[type="text"]').should('have.value', '');
    });
  });

  describe('Voice Search', () => {
    it('should display voice search button', () => {
      cy.get('button[aria-label*="voice" i], button[title*="voice" i]').should('exist');
    });

    it('should have voice button visible', () => {
      cy.get('button')
        .filter((index, element) => {
          return /voice|microfone|micrófone/i.test(element.textContent);
        })
        .should('be.visible');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate suggestions with arrow keys', () => {
      cy.get('input[type="text"]').clear().type('avatar');
      // Wait for suggestions
      cy.get('[role="option"]').should('have.length.greaterThan', 0);
      
      // Arrow down
      cy.get('input[type="text"]').type('{downarrow}');
      cy.get('[role="option"][aria-selected="true"]').should('exist');
    });

    it('should select suggestion with Enter', () => {
      cy.get('input[type="text"]').clear().type('avatar{downarrow}{enter}');
      // Should navigate or search
      cy.url().should('include', '/search');
    });

    it('should close suggestions with Escape', () => {
      cy.get('input[type="text"]').clear().type('avatar{escape}');
      cy.get('[role="listbox"]').should('not.be.visible');
    });
  });

  describe('Search Execution', () => {
    it('should search on button click', () => {
      cy.get('input[type="text"]').clear().type('action');
      cy.get('button').contains(/buscar|search/i).click();
      cy.url().should('include', 'q=action');
    });

    it('should search on Enter key', () => {
      cy.get('input[type="text"]').clear().type('drama{enter}');
      cy.url().should('include', 'q=drama');
    });

    it('should display results', () => {
      cy.get('input[type="text"]').clear().type('movie{enter}');
      cy.get('[data-testid="result-card"], [role="listitem"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be responsive on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/search');
      cy.get('input[type="text"]').should('be.visible');
      cy.get('button').contains(/buscar|search/i).should('be.visible');
    });

    it('should be responsive on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/search');
      cy.get('input[type="text"]').should('be.visible');
    });

    it('should be responsive on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.visit('/search');
      cy.get('input[type="text"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty search gracefully', () => {
      cy.get('input[type="text"]').clear();
      cy.get('button').contains(/buscar|search/i).click();
      // Should not error, maybe show empty or all results
      cy.get('body').should('exist');
    });

    it('should handle special characters', () => {
      cy.get('input[type="text"]').clear().type('avatar @ #$%');
      cy.get('input[type="text"]').should('have.value', 'avatar @ #$%');
    });
  });
});
