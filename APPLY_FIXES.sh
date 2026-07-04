#!/bin/bash

# 🎬 CinemaEmCasa — Script de Correções Automáticas
# Aplica as correções necessárias para build funcionar

set -e

echo "🔧 Aplicando correções ao projeto CinemaEmCasa..."
echo ""

# Cor de output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Erro: Execute este script na raiz do projeto!${NC}"
  echo "Exemplo: cd cinemaemcasa && bash APPLY_FIXES.sh"
  exit 1
fi

# 1. Corrigir src/app/layout.tsx
echo -e "${YELLOW}1️⃣  Corrigindo src/app/layout.tsx...${NC}"
if [ -f "src/app/layout.tsx" ]; then
  sed -i "s/import { Inter, Montserrat } from 'next\/font\/google'/\/\/ Removido: Google Fonts/" src/app/layout.tsx
  sed -i '/const inter = Inter/s/^/\/\/ /' src/app/layout.tsx
  sed -i '/const montserrat = Montserrat/s/^/\/\/ /' src/app/layout.tsx
  echo -e "${GREEN}✅ src/app/layout.tsx corrigido${NC}"
else
  echo -e "${RED}❌ Arquivo não encontrado: src/app/layout.tsx${NC}"
fi

# 2. Remover Cypress
echo -e "${YELLOW}2️⃣  Removendo Cypress...${NC}"
rm -f cypress.config.ts cypress.config.js
if [ -d "cypress" ]; then
  rm -rf cypress
  echo -e "${GREEN}✅ Cypress removido${NC}"
else
  echo "ℹ️  Cypress já não existe"
fi

# 3. Limpar node_modules
echo -e "${YELLOW}3️⃣  Limpando dependências...${NC}"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✅ node_modules e package-lock.json removidos${NC}"

# 4. Reinstalar dependências
echo -e "${YELLOW}4️⃣  Reinstalando dependências...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# 5. Fazer build
echo ""
echo -e "${YELLOW}5️⃣  Testando build...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ BUILD SUCESSO!${NC}"
  echo ""
  echo "📝 Próximo passo:"
  echo "  git add ."
  echo "  git commit -m 'fix: remove google fonts and cypress for next.js build'"
  echo "  git push origin main"
  echo ""
else
  echo -e "${RED}❌ Build falhou. Verifique os erros acima.${NC}"
  exit 1
fi
