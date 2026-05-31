describe('Authentication Flow E2E Tests', () => {
  describe('Login Page', () => {
    before(() => {
      cy.visit('/login');
    });

    it('should load login page', () => {
      cy.get('h1').should('contain.text', /login|entrar|sign in/i);
    });

    it('should display email input', () => {
      cy.get('input[type="email"]').should('be.visible');
    });

    it('should display password input', () => {
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should display login button', () => {
      cy.get('button').contains(/login|entrar|sign in/i).should('be.visible');
    });

    it('should have register link', () => {
      cy.get('a').contains(/register|criar|sign up|cadastro/i).should('be.visible');
    });

    it('should have forgot password link', () => {
      cy.get('a').contains(/forgot|esqueci|password/i).should('be.visible');
    });
  });

  describe('Login Validation', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should require email field', () => {
      cy.get('input[type="password"]').type('password');
      cy.get('button').contains(/login|entrar/i).click();
      cy.get('input[type="email"]').should('have.focus').or('have.attr', 'aria-invalid');
    });

    it('should require password field', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button').contains(/login|entrar/i).click();
      cy.get('input[type="password"]').should('have.focus').or('have.attr', 'aria-invalid');
    });

    it('should validate email format', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button').contains(/login|entrar/i).click();
      // Should show error message
      cy.get('[role="alert"], .error, [data-testid="error"]').should('be.visible');
    });

    it('should show loading state on submit', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button').contains(/login|entrar/i).click();
      cy.get('button').should('be.disabled').or('contain', /loading|carregando/i);
    });
  });

  describe('Register Page', () => {
    before(() => {
      cy.visit('/register');
    });

    it('should load register page', () => {
      cy.get('h1').should('contain.text', /register|cadastro|sign up/i);
    });

    it('should display registration form fields', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('should display register button', () => {
      cy.get('button').contains(/register|cadastro|sign up/i).should('be.visible');
    });

    it('should have login link', () => {
      cy.get('a').contains(/login|entrar/i).should('be.visible');
    });
  });

  describe('Password Recovery', () => {
    before(() => {
      cy.visit('/forgot-password');
    });

    it('should load forgot password page', () => {
      cy.get('h1').should('contain.text', /forgot|esqueci|recovery/i);
    });

    it('should display email input', () => {
      cy.get('input[type="email"]').should('be.visible');
    });

    it('should display submit button', () => {
      cy.get('button').contains(/submit|enviar/i).should('be.visible');
    });
  });
});
