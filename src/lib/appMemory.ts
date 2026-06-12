import { clearSuggestionsCache } from './searchSuggestions';
import { clearLocationCache } from './geolocation';
import { initializeContentSession } from './homeContentManager';
import { createClient } from './supabase';

/**
 * Limpa toda a memória volátil e persistente da aplicação no lado do cliente.
 * Útil para logout, troca de perfil ou manutenção de performance em Smart TVs.
 */
export function clearAllApplicationMemory(): void {
  try {
    // 1. Limpa caches em memória (Voz, Sugestões)
    clearSuggestionsCache();

    // 2. Limpa dados persistentes no LocalStorage
    if (typeof window !== 'undefined') {
      clearLocationCache();
      initializeContentSession(); // Reseta o cache de conteúdos exibidos na Home
      
      console.log('🧠 Memória da aplicação limpa com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao limpar memória da aplicação:', error);
  }
}

/**
 * Monitora a visibilidade da página para recuperar o estado após ociosidade.
 * Essencial para Smart TVs que suspendem o processo do browser.
 */
export function setupAppHealthMonitor(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App recuperado de ociosidade. Verificando integridade...');
      
      const sb = createClient();
      // Verifica se a sessão do Supabase ainda é válida
      sb.auth.getSession().then(({ data }) => {
        if (!data.session) {
          console.warn('Sessão expirada durante ociosidade. Redirecionando...');
          window.location.href = '/loading';
        }
      });
    }
  });

  // Previne o erro de "página inexistente" capturando erros de rota não encontrados globalmente
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('id') || event.reason?.message?.includes('undefined')) {
      console.error('Erro de estado detectado. Recuperando...');
      window.location.href = '/home';
    }
  });
}