#!/usr/bin/env node
/**
 * Script de Build para IPK (LG WebOS)
 * Cria arquivo empacotado pronto para instalar em TVs LG WebOS 4.0+
 * Uso: npm run build:webos
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const packageJson = require('../package.json')
const PROJECT_ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(PROJECT_ROOT, 'out')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const PKG_DIR = path.join(DIST_DIR, 'com.paixaoflix.cinemaemcasa')
const OUT_TAR = path.join(DIST_DIR, 'cinema-em-casa-webos.tar.gz')

try {
  console.log('🎬 Iniciando build para LG WebOS...\n')

  if (!fs.existsSync(OUT_DIR) && !fs.existsSync(path.join(PROJECT_ROOT, '.next'))) {
    console.log('📦 Gerando build de produção...')
    execSync('npm run build', { stdio: 'inherit' })
  }

  const hasOut = fs.existsSync(OUT_DIR)

  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Limpando build anterior...')
    fs.rmSync(DIST_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(PKG_DIR, { recursive: true })

  console.log('📋 Copiando arquivos de build...')
  if (hasOut) {
    execSync(`cp -r ${OUT_DIR}/* ${PKG_DIR}/`, { stdio: 'pipe' })
    console.log('  ✓ Arquivos nativos (Static Mode)')
  } else {
    // Modo Hosted App: Otimizado para catálogos dinâmicos (Filmes/Séries)
    execSync(`cp -r ${path.join(PROJECT_ROOT, 'public')}/* ${PKG_DIR}/`, { stdio: 'pipe' })
    console.log('  ✓ Configurações de plataforma (Hosted Mode)')
  }

  const configFiles = ['appinfo.json', 'manifest.webos.json', 'sw.js', 'logo.png', 'icon.png', 'largeIcon.png', 'splash.png']
  configFiles.forEach(file => {
    const src = path.join(PROJECT_ROOT, 'public', file)
    if (fs.existsSync(src)) {
      execSync(`cp ${src} ${PKG_DIR}/${file}`, { stdio: 'pipe' })
      console.log(`  ✓ ${file}`)
    }
  })

  const manifestSrc = path.join(PKG_DIR, 'manifest.webos.json')
  const manifestDst = path.join(PKG_DIR, 'manifest.json')
  if (fs.existsSync(manifestSrc)) {
    execSync(`mv ${manifestSrc} ${manifestDst}`, { stdio: 'pipe' })
    console.log('  ✓ manifest.json (versão WebOS)')
  }

  console.log('\n⚙️  Criando configurações customizadas...')
  const webosConfig = {
    app: {
      id: 'com.paixaoflix.cinemaemcasa',
      name: 'Cinema em Casa',
      version: packageJson.version || '0.1.0',
      minWebOSVersion: '4.0',
    },
    features: {
      spatialNavigation: true,
      magicRemote: true,
      voiceSearch: true,
      pushNotifications: true,
    },
    performance: {
      preload: true,
      cache: true,
      hardwareAcceleration: 'on',
    },
  }
  fs.writeFileSync(path.join(PKG_DIR, 'webos-config.json'), JSON.stringify(webosConfig, null, 2))
  console.log('  ✓ webos-config.json')

  const installScript = '#!/bin/bash\necho "Cinema em Casa - WebOS Installer"\n'
  fs.writeFileSync(path.join(PKG_DIR, 'install.sh'), installScript, { mode: 0o755 })
  console.log('  ✓ install.sh')

  // Verificação de segurança: Garantir que ícones essenciais existam
  const requiredIcons = ['icon.png', 'largeIcon.png']
  requiredIcons.forEach(icon => {
    if (!fs.existsSync(path.join(PKG_DIR, icon))) {
      console.warn(`  ⚠️  Aviso: ${icon} não encontrado. Usando logo.png como fallback.`)
      execSync(`cp ${path.join(PROJECT_ROOT, 'public/logo.png')} ${path.join(PKG_DIR, icon)}`)
    }
  })

  console.log('\n📦 Empacotando arquivo...')
  
  // Tenta gerar o IPK oficial (mais rápido e compatível com instaladores visuais)
  let ipkFile = null
  try {
    console.log('  🎁 Gerando pacote .ipk (formato oficial LG)...')
    
    // Tenta primeiro o comando global, depois o npx
    try {
      execSync(`ares-package ${PKG_DIR} -o ${DIST_DIR}`, { stdio: 'pipe' })
    } catch {
      execSync(`npx ares-package ${PKG_DIR} -o ${DIST_DIR}`, { stdio: 'pipe' })
    }

    const files = fs.readdirSync(DIST_DIR)
    ipkFile = files.find(f => f.endsWith('.ipk'))
  } catch (e) {
    console.log('  ⚠️  Falha ao gerar .ipk:', e.message)
    console.log('  Gerando apenas .tar.gz de fallback.')
  }

  const tarCmd = `cd ${DIST_DIR} && tar -czf cinema-em-casa-webos.tar.gz com.paixaoflix.cinemaemcasa/`
  execSync(tarCmd, { stdio: 'pipe' })

  const fileSize = (fs.statSync(OUT_TAR).size / 1024 / 1024).toFixed(2)
  console.log(`  ✓ cinema-em-casa-webos.tar.gz (${fileSize}MB)`)
  if (ipkFile) {
    const ipkSize = (fs.statSync(path.join(DIST_DIR, ipkFile)).size / 1024 / 1024).toFixed(2)
    console.log(`  ✓ ${ipkFile} (${ipkSize}MB)`)
  }

  console.log('\n✅ Build WebOS concluído!\n')
  console.log(`📍 Arquivos gerados em: ${DIST_DIR}\n`)

  if (ipkFile) {
    console.log('🚀 MODO RÁPIDO RECOMENDADO:')
    console.log(`1. Baixe o "WebOS Dev Manager" (https://github.com/webosbrew/dev-manager-desktop)`)
    console.log(`2. Arraste o arquivo "${ipkFile}" para dentro dele.`)
    console.log('3. Clique em Install. Pronto!\n')
  }

  console.log('📖 Como instalar em TV LG WebOS:\n')
  console.log('1. Ative modo desenvolvedor na TV:')
  console.log('   Configurações > Sistema > Desenvolvedor > Modo dev ON\n')
  console.log('2. Instale usando o webOS CLI (Recomendado):\n')
  console.log('   # 1. Adicione a TV: npx ares-setup-device')
  console.log('   #    (Use "root" no user, SSH, e deixe o nome da chave VAZIO)')
  console.log('   # 2. Troque chaves: npm run webos:auth')
  console.log('   # 3. Instale: npm run webos:install\n')
  console.log('   Nota: O acesso root manual via SCP costuma ser bloqueado por falta de chaves SSH no WebOS moderno.\n')
  console.log('💡 Dica: Se o site de VAPID keys estiver fora do ar, gere localmente com:')
  console.log('   npx web-push generate-vapid-keys\n')

  console.log('3. Reinicie a TV\n')

  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    webOSMin: '4.0',
    appId: 'com.paixaoflix.cinemaemcasa',
    fileSize: `${fileSize}MB`,
  }
  fs.writeFileSync(path.join(DIST_DIR, 'BUILD_INFO.json'), JSON.stringify(buildInfo, null, 2))

} catch (error) {
  console.error('❌ Erro:', error.message)
  process.exit(1)
}
