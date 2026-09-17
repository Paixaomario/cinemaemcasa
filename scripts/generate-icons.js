const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const logo = path.join(publicDir, 'logo.png');

const sizes = [
  { name: 'icon.png', size: '80x80' },
  { name: 'largeIcon.png', size: '130x130' },
  { name: 'splash.png', size: '1920x1080' }
];

console.log('🎨 Gerando ícones redimensionados para WebOS...');

sizes.forEach(img => {
  try {
    const dest = path.join(publicDir, img.name);
    // Usa ffmpeg para redimensionar mantendo proporção e preenchendo fundo se necessário
    execSync(`ffmpeg -i ${logo} -vf "scale=${img.size.split('x')[0]}:${img.size.split('x')[1]}:force_original_aspect_ratio=decrease,pad=${img.size.split('x')[0]}:${img.size.split('x')[1]}:(ow-iw)/2:(oh-ih)/2:black@0" -y ${dest}`, { stdio: 'ignore' });
    console.log(`  ✓ ${img.name} (${img.size}) gerado com sucesso.`);
  } catch (e) {
    console.error(`  x Erro ao gerar ${img.name}. Verifique se o ffmpeg está instalado.`);
  }
});