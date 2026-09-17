/**
 * Monta a pasta dist-webos/ pronta para ser empacotada com a ferramenta
 * oficial da LG (ares-package, parte do webOS TV SDK/CLI).
 *
 * Recriado do zero após o antigo scripts/build-webos.js ter sido
 * substituído — este é um ponto de partida funcional, não uma cópia do
 * original.
 *
 * Uso:
 *   1. node scripts/build-webos.js
 *   2. Edite dist-webos/index.html com a URL real do seu deploy Vercel
 *      (ou automatize isso passando a URL como variável de ambiente)
 *   3. Instale o webOS TV CLI: https://webostv.developer.lge.com/develop/tools/cli-installation
 *   4. ares-package dist-webos/ -o ./
 *   5. ares-install ./com.cinemaemcasa.app_1.0.0_all.ipk (com a TV em modo dev)
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'webos');
const DEST = path.join(__dirname, '..', 'dist-webos');

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const file of fs.readdirSync(SRC)) {
  fs.copyFileSync(path.join(SRC, file), path.join(DEST, file));
}

console.log('dist-webos/ pronta. Faltam os ícones (icon.png, icon-large.png, splash.png) —');
console.log('adicione-os em webos/ antes de rodar este script novamente.');
console.log('Depois: ares-package dist-webos/ -o ./');
