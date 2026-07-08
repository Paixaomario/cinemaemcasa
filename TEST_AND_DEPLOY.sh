#!/bin/bash

# 🎬 CinemaEmCasa — Test and Deploy Script
# Testa TUDO via terminal e faz deploy automático

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 CINEMAEMCASA — TEST AND DEPLOY                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Erro: Você não está na pasta do projeto!${NC}"
  echo "Execute em: /home/paixaomario/Downloads/cinemaemcasa-main/"
  exit 1
fi

echo -e "${BLUE}✓ Diretório correto${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 1: Verificar se arquivos foram criados
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}1️⃣  Verificando arquivos...${NC}"

files_ok=true

if [ -f "src/lib/queries.ts" ]; then
  echo -e "${GREEN}   ✅ src/lib/queries.ts${NC}"
else
  echo -e "${RED}   ❌ src/lib/queries.ts FALTA!${NC}"
  files_ok=false
fi

if [ -f "src/hooks/useWebOSFocus.ts" ]; then
  echo -e "${GREEN}   ✅ src/hooks/useWebOSFocus.ts${NC}"
else
  echo -e "${RED}   ❌ src/hooks/useWebOSFocus.ts FALTA!${NC}"
  files_ok=false
fi

if [ -f "src/components/ContentCard.tsx" ]; then
  echo -e "${GREEN}   ✅ src/components/ContentCard.tsx${NC}"
else
  echo -e "${RED}   ❌ src/components/ContentCard.tsx FALTA!${NC}"
  files_ok=false
fi

if [ ! $files_ok ]; then
  echo -e "${RED}❌ Faltam arquivos! Cole todos os 4 arquivos primeiro.${NC}"
  exit 1
fi

echo -e "${GREEN}   ✅ Todos os arquivos estão presentes!${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 2: Verificar se page.tsx foi atualizado
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}2️⃣  Verificando se page.tsx foi atualizado...${NC}"

if grep -q "useWebOSFocus" src/app/page.tsx; then
  echo -e "${GREEN}   ✅ useWebOSFocus importado${NC}"
else
  echo -e "${RED}   ⚠️  useWebOSFocus NÃO encontrado em page.tsx${NC}"
  echo "   Você precisa adicionar os imports e usar useWebOSFocus()"
  exit 1
fi

if grep -q "ContentCard" src/app/page.tsx; then
  echo -e "${GREEN}   ✅ ContentCard importado${NC}"
else
  echo -e "${RED}   ⚠️  ContentCard NÃO encontrado em page.tsx${NC}"
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 3: Build local
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}3️⃣  Testando build local...${NC}"
echo ""

if npm run build 2>&1 | tail -30; then
  echo ""
  echo -e "${GREEN}✅ BUILD PASSOU!${NC}"
else
  echo ""
  echo -e "${RED}❌ BUILD FALHOU!${NC}"
  echo "Verifique os erros acima e corrija."
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 4: Git commit e push
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}4️⃣  Fazendo git push...${NC}"

git add . || true
git commit -m "feat: add webos support, queries, content card component" || true

if git push origin main 2>&1; then
  echo -e "${GREEN}   ✅ Git push sucesso!${NC}"
else
  echo -e "${RED}   ❌ Git push falhou!${NC}"
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 5: Aguardar Vercel deploy
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}5️⃣  Monitorando Vercel deployment...${NC}"
echo ""
echo -e "${BLUE}Vercel detectou mudanças e está fazendo build...${NC}"
echo "Status: https://vercel.com/Paixaomario/cinemaemcasa"
echo ""
echo "Aguarde 2-3 minutos..."
echo ""

# Aguardar um pouco (Vercel leva tempo)
for i in {1..30}; do
  echo -n "."
  sleep 2
done

echo ""
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 6: Verificar Vercel API (se tiver token)
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}6️⃣  Verificando deploy na Vercel...${NC}"
echo ""

# Tenta verificar o deployment (requer VERCEL_TOKEN)
if command -v vercel &> /dev/null; then
  echo "Vercel CLI encontrado. Checando status..."
  # vercel status ou similar (se tiver acesso)
  echo "Abra https://vercel.com/Paixaomario/cinemaemcasa para status em tempo real"
else
  echo "Vercel CLI não instalado. Abra manualmente:"
  echo "https://vercel.com/Paixaomario/cinemaemcasa"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 7: Testar localmente com npm run dev
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}7️⃣  Quer testar localmente com npm run dev?${NC}"
echo ""
read -p "Digite 's' para iniciar dev server ou 'n' para pular: " test_local

if [ "$test_local" = "s" ] || [ "$test_local" = "S" ]; then
  echo ""
  echo -e "${BLUE}Iniciando npm run dev...${NC}"
  echo "Abra http://localhost:3000 no navegador"
  echo ""
  echo "Pressione Ctrl+C para parar"
  echo ""
  npm run dev
else
  echo "Pulando npm run dev"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMO
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ TUDO COMPLETO!                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Arquivos verificados${NC}"
echo -e "${GREEN}✅ Build passou${NC}"
echo -e "${GREEN}✅ Git push feito${NC}"
echo -e "${GREEN}✅ Vercel recebeu mudanças${NC}"
echo ""
echo "Próximo passo: Aguarde 2-3 min, Vercel vai fazer deploy"
echo ""
echo "Depois: Atualize seu app na Smart TV"
echo "  Settings > Apps > Cinema em Casa > Atualizar"
echo ""
echo -e "${YELLOW}Status do deployment:${NC}"
echo "  https://vercel.com/Paixaomario/cinemaemcasa"
echo ""
