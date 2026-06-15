const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script Profissional de Build e Empacotamento para Samsung Tizen
 * Requer Tizen CLI instalado e perfil de certificado configurado.
 */

const APP_NAME = 'cinemaemcasa';
const DIST_DIR = path.join(__dirname, '../out');
const TIZEN_DIST = path.join(__dirname, '../dist/tizen');
const CERT_PROFILE = 'CinemaEmCasaProfile'; // Nome do perfil no Tizen Certificate Manager

async function buildTizen() {
  console.log('🚀 Iniciando Build para Samsung Tizen...');

  try {
    // 1. Build do Next.js (Static Export)
    console.log('📦 Gerando exportação estática do Next.js...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Preparar diretório de distribuição Tizen
    if (!fs.existsSync(TIZEN_DIST)) {
      fs.mkdirSync(TIZEN_DIST, { recursive: true });
    }

    // 3. Copiar arquivos necessários (config.xml e ícones)
    console.log('📄 Copiando manifestos Tizen...');
    fs.copyFileSync(path.join(__dirname, '../public/config.xml'), path.join(DIST_DIR, 'config.xml'));
    
    // 4. Empacotamento (.wgt)
    console.log('🛠️  Empacotando widget...');
    execSync(`tizen package -t wgt -s ${CERT_PROFILE} -- ${DIST_DIR} -o ${TIZEN_DIST}`, { stdio: 'inherit' });

    const wgtFile = path.join(TIZEN_DIST, 'index.wgt');
    const finalName = path.join(TIZEN_DIST, `${APP_NAME}.wgt`);
    
    if (fs.existsSync(wgtFile)) {
      fs.renameSync(wgtFile, finalName);
      console.log(`✅ Sucesso! Pacote assinado disponível em: ${finalName}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o build Tizen:', error.message);
    console.log('\n💡 Dica: Certifique-se de que o Tizen CLI está no PATH e o perfil de certificado "' + CERT_PROFILE + '" existe.');
    process.exit(1);
  }
}

buildTizen();