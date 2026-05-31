import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Inicia a reprodução de um conteúdo programaticamente.
 * Útil para comandos de voz (Alexa) ou automações.
 */
export function playContent(router: AppRouterInstance, contentId: string) {
  // Navega direto para o player, pulando a tela de detalhes se necessário
  router.push(`/assistir/${contentId}`);
}

export function openDetails(router: AppRouterInstance, contentId: string) {
  router.push(`/detalhes/${contentId}`);
}