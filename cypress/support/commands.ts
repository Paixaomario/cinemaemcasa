/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Comando customizado para simular uma sessão de usuário logado no Supabase.
       * @example cy.login()
       */
      login(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  // Implementação para simular o token do Supabase no localStorage
  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: {
      id: 'user-1',
      email: 'test@cinemaemcasa.com',
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  window.localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
});

export {};