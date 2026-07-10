import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Inicia a reprodução de um conteúdo programaticamente.
 * Útil para comandos de voz (Alexa) ou automações.
 */
export function playContent(router: AppRouterInstance, contentId: string) {
  if (!contentId || contentId === 'undefined' || contentId === 'null') {
    console.error('Tentativa de reprodução com ID inválido bloqueada.');
    router.push('/home');
    return;
  }
  // Navega direto para o player, pulando a tela de detalhes se necessário
  router.push(`/assistir/${contentId}`);
}

export function openDetails(router: AppRouterInstance, contentId: string) {
  if (!contentId || contentId === 'undefined' || contentId === 'null') {
    router.push('/home');
    return;
  }
  router.push(`/detalhes/${contentId}`);
}