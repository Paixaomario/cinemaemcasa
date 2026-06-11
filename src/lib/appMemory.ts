import { clearSuggestionsCache } from './searchSuggestions';
import { clearLocationCache } from './geolocation';
import { initializeContentSession } from './homeContentManager';

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