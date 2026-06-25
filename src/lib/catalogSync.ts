/**
 * Sistema de Sincronização Automática do Catálogo
 * Garante que todos os filmes e séries sejam indexados automaticamente
 */

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutos
const API_URL = '/api/sync-catalog'

let syncInterval: NodeJS.Timeout | null = null
let isSyncing = false

/**
 * Inicia a sincronização automática do catálogo
 */
export function startCatalogSync() {
  if (typeof window === 'undefined') return
  if (syncInterval) return // Já está rodando

  console.log('[Catalog Sync] Iniciando sincronização automática a cada 5 minutos')

  // Sincroniza imediatamente
  syncCatalog()

  // Configura intervalo periódico
  syncInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncCatalog()
    }
  }, SYNC_INTERVAL)
}

/**
 * Para a sincronização automática do catálogo
 */
export function stopCatalogSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('[Catalog Sync] Sincronização automática parada')
  }
}

/**
 * Sincroniza o catálogo manualmente
 */
export async function syncCatalog(): Promise<boolean> {
  if (isSyncing) {
    console.log('[Catalog Sync] Já está sincronizando, aguardando...')
    return false
  }

  isSyncing = true

  try {
    console.log('[Catalog Sync] Iniciando sincronização...')
    
    const response = await fetch(API_URL, {
      method: 'POST',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.ok) {
      console.log('[Catalog Sync] Sincronização concluída:', result.data)
      return true
    } else {
      console.error('[Catalog Sync] Erro na sincronização:', result.error)
      return false
    }
  } catch (error) {
    console.error('[Catalog Sync] Erro ao sincronizar catálogo:', error)
    return false
  } finally {
    isSyncing = false
  }
}
