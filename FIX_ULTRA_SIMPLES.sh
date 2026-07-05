#!/bin/bash

set -e

echo "🔧 CORREÇÃO ULTRA-SIMPLES - RESTAURAR BACKUP"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Restaurar backup se existir
if [ -f "src/app/layout.tsx.backup" ]; then
  echo "1️⃣  Restaurando backup..."
  cp src/app/layout.tsx.backup src/app/layout.tsx
  echo "   ✅ Backup restaurado"
else
  echo "⚠️  Nenhum backup encontrado"
  echo "   Isso pode ser um problema!"
fi

# PASSO 2: Remover APENAS as 2 linhas de import de Google Fonts
echo "2️⃣  Removendo Google Fonts..."
sed -i "/import { Inter, Montserrat } from 'next\/font\/google'/d" src/app/layout.tsx
echo "   ✅ Import removido"

# PASSO 3: Remover APENAS a linha com const inter
echo "3️⃣  Removendo const inter..."
sed -i "/const inter = Inter({/,/})/d" src/app/layout.tsx
echo "   ✅ const inter removido"

# PASSO 4: Remover APENAS a linha com const montserrat
echo "4️⃣  Removendo const montserrat..."
sed -i "/const montserrat = Montserrat({/,/})/d" src/app/layout.tsx
echo "   ✅ const montserrat removido"

# PASSO 5: Remover className com variáveis de fonte
echo "5️⃣  Removendo className com fontes..."
sed -i 's/className={`\${inter\.variable} \${montserrat\.variable}`}//g' src/app/layout.tsx
echo "   ✅ className removido"

# PASSO 6: Remover Cypress
echo "6️⃣  Removendo Cypress..."
rm -f cypress.config.ts cypress.config.js 2>/dev/null || true
rm -rf cypress 2>/dev/null || true
echo "   ✅ Cypress removido"

# PASSO 7: npm
echo "7️⃣  Limpando e reinstalando..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --quiet 2>&1 | tail -2
echo "   ✅ npm pronto"

# PASSO 8: Build
echo ""
echo "8️⃣  Testando build..."
if npm run build 2>&1 | tail -20; then
  echo ""
  echo "✅ BUILD SUCESSO!"
  echo ""
  echo "Próximo passo:"
  echo "  git add ."
  echo "  git commit -m \"fix: remove google fonts\""
  echo "  git push origin main"
else
  echo ""
  echo "❌ Build falhou"
  exit 1
fi
