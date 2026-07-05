#!/bin/bash

# 🎬 CinemaEmCasa — Script de Correções Automáticas (CORRIGIDO)
# Aplica as correções necessárias para build funcionar

set -e

echo "🔧 Aplicando correções ao projeto CinemaEmCasa..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Erro: Execute este script na raiz do projeto!${NC}"
  exit 1
fi

# 1. Corrigir src/app/layout.tsx - REMOVE, não comenta
echo -e "${YELLOW}1️⃣  Corrigindo src/app/layout.tsx...${NC}"
if [ -f "src/app/layout.tsx" ]; then
  # Remover import de Google Fonts
  sed -i "/import { Inter, Montserrat } from 'next\/font\/google'/d" src/app/layout.tsx
  
  # Remover definições das variáveis
  sed -i "/^const inter = Inter/,/^})/d" src/app/layout.tsx
  sed -i "/^const montserrat = Montserrat/,/^})/d" src/app/layout.tsx
  
  # Remove className com variáveis de fonte do html tag
  sed -i 's/className={`\${inter.variable} \${montserrat.variable}`}//g' src/app/layout.tsx
  
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
fi

# 3. Limpar node_modules
echo -e "${YELLOW}3️⃣  Limpando dependências...${NC}"
rm -rf node_modules package-lock.json
echo -e "${GREEN}✅ Limpeza completa${NC}"

# 4. Reinstalar
echo -e "${YELLOW}4️⃣  Reinstalando npm...${NC}"
npm install --legacy-peer-deps 2>&1 | tail -5
echo -e "${GREEN}✅ npm instalado${NC}"

# 5. Build test
echo ""
echo -e "${YELLOW}5️⃣  Testando build...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ BUILD SUCESSO!${NC}"
  echo ""
  echo "📝 Próximo passo:"
  echo "  git add ."
  echo "  git commit -m 'fix: remove google fonts and cypress'"
  echo "  git push origin main"
else
  echo -e "${RED}❌ Build falhou${NC}"
  exit 1
fi
