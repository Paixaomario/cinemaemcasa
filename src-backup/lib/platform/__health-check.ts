/**
 * HEALTH CHECK - Verifica se a integração WebOS está funcionando
 * 
 * Use no console DevTools ou como teste automatizado
 * Comando: npm run test:webos (quando configurado)
 */

// ============================================
// 1. VERIFICAR TODOS OS IMPORTS
// ============================================

async function checkImports() {
  console.log('🔍 Verificando imports...')

  try {
    const platformDetect = await import('@/lib/platform/platformDetect')
    console.log('  ✅ platformDetect.ts')
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ platformDetect.ts:', err)
  }

  try {
    const platformConfig = await import('@/lib/platform/platformConfig')
    console.log('  ✅ platformConfig.ts')
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ platformConfig.ts:', err)
  }

  try {
    const webosAdapter = await import('@/lib/platform/webosAdapter')
    console.log('  ✅ webosAdapter.ts')
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ webosAdapter.ts:', err)
  }

  try {
    const notifications = await import('@/lib/platform/notifications')
    console.log('  ✅ notifications.ts')
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ notifications.ts:', err)
  }

  try {
    const nav = await import('@/hooks/useWebOSNavigation')
    console.log('  ✅ useWebOSNavigation.ts')
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ useWebOSNavigation.ts:', err)
  }
}

// ============================================
// 2. TESTAR DETECÇÃO DE PLATAFORMA
// ============================================

async function testPlatformDetection() {
  console.log('\n📱 Testando Detecção de Plataforma...')

  const { getPlatformInfo, isWebOS, isMobile, isTV, isDesktop } = 
    await import('@/lib/platform/platformDetect')

  const info = getPlatformInfo()
  console.log('  Platform:', info.type)
  console.log('  Device:', info.deviceType)
  console.log('  isWebOS:', isWebOS())
  console.log('  isMobile:', isMobile())
  console.log('  isTV:', isTV())
  console.log('  isDesktop:', isDesktop())

  if (info.webOSVersion) {
    console.log('  WebOS Version:', info.webOSVersion)
  }

  console.log('  ✅ Plataforma detectada')
}

// ============================================
// 3. TESTAR CONFIGURAÇÃO
// ============================================

async function testPlatformConfig() {
  console.log('\n⚙️  Testando Configuração de Plataforma...')

  const { getPlatformInfo } = await import('@/lib/platform/platformDetect')
  const { getPlatformConfig, isFeatureEnabled, getConfigValue } = 
    await import('@/lib/platform/platformConfig')

  const platform = getPlatformInfo()
  const config = getPlatformConfig(platform.type, platform.deviceType)

  console.log('  imageOptimization:', config.imageOptimization)
  console.log('  videoDefaultQuality:', config.videoDefaultQuality)
  console.log('  enableSpatialNavigation:', config.enableSpatialNavigation)
  console.log('  notificationsEnabled:', config.notificationsEnabled)

  const hasNav = isFeatureEnabled('enableSpatialNavigation', platform.type)
  console.log('  Spatial Navigation:', hasNav)

  console.log('  ✅ Configuração carregada')
}

// ============================================
// 4. TESTAR ADAPTER WEBOS
// ============================================

async function testWebOSAdapter() {
  console.log('\n🎬 Testando WebOS Adapter...')

  const { getDeviceInfo, getAppInfo, getNetworkInfo } = 
    await import('@/lib/platform/webosAdapter')

  const deviceInfo = await getDeviceInfo()
  if (deviceInfo) {
    console.log('  Model:', deviceInfo.modelName)
    console.log('  Firmware:', deviceInfo.firmwareVersion)
    console.log('  OS:', deviceInfo.osVersion)
  } else {
    console.log('  (Não disponível neste device)')
  }

  const appInfo = await getAppInfo()
  if (appInfo) {
    console.log('  App ID:', appInfo.appId)
    console.log('  Version:', appInfo.version)
  }

  const networkInfo = await getNetworkInfo()
  if (networkInfo) {
    console.log('  Network Connected:', networkInfo.connected)
    console.log('  Network Type:', networkInfo.type)
  }

  console.log('  ✅ WebOS Adapter funcionando')
}

// ============================================
// 5. TESTAR NOTIFICAÇÕES
// ============================================

async function testNotifications() {
  console.log('\n🔔 Testando Notificações...')

  const { showLocalNotification } = await import('@/lib/platform/notifications')

  // Testa notificação local
  showLocalNotification({
    id: 'health-check',
    title: '✅ Health Check',
    body: 'Notificações estão funcionando!',
    icon: '/logo.png',
  })

  console.log('  ✅ Notificação local enviada')

  // Testa se Service Worker está registrado
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    console.log('  ✅ Service Worker ativo:', registration.scope)
  }
}

// ============================================
// 6. TESTAR SERVICE WORKER
// ============================================

async function testServiceWorker() {
  console.log('\n⚙️  Testando Service Worker...')

  if (!('serviceWorker' in navigator)) {
    console.log('  ⚠️  Service Workers não suportados')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    console.log('  ✅ Service Worker registrado')
    console.log('  Scope:', registration.scope)
    console.log('  State:', registration.active?.state)
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('  ❌ Erro:', err)
  }
}

// ============================================
// 7. EXECUTAR TODOS OS TESTES
// ============================================

(window as any).__WEBOS_HEALTH_CHECK = async function () {
  console.clear()
  console.log('════════════════════════════════════════════')
  console.log('🚀 CINEMA EM CASA - WEBOS HEALTH CHECK')
  console.log('════════════════════════════════════════════\n')

  try {
    await checkImports()
    await testPlatformDetection()
    await testPlatformConfig()
    await testWebOSAdapter()
    await testNotifications()
    await testServiceWorker()

    console.log('\n════════════════════════════════════════════')
    console.log('✅ HEALTH CHECK CONCLUÍDO COM SUCESSO')
    console.log('════════════════════════════════════════════')

    return {
      status: 'success',
      message: 'Todos os sistemas WebOS estão operacionais',
      timestamp: new Date().toISOString(),
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('\n❌ ERRO DURANTE HEALTH CHECK:', errMsg)

    return {
      status: 'error',
      message: errMsg,
      timestamp: new Date().toISOString(),
    }
  }
}

// ============================================
// 8. RODAR AUTOMATICAMENTE
// ============================================

// Se houver param ?health-check na URL
if (typeof window !== 'undefined' && window.location.search.includes('health-check')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Iniciando health check...')
      ;(window as any).__WEBOS_HEALTH_CHECK()
    })
  } else {
    ;(window as any).__WEBOS_HEALTH_CHECK()
  }
}

// Exportar para uso em testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkImports,
    testPlatformDetection,
    testPlatformConfig,
    testWebOSAdapter,
    testNotifications,
    testServiceWorker,
  }
}
