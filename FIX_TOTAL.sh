#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🔧 CORREÇÃO TOTAL - FORMA SEGURA                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ ERRO: Você não está na pasta correta!${NC}"
  echo "Execute em: /home/paixaomario/Downloads/cinemaemcasa-main/"
  exit 1
fi

echo -e "${BLUE}✓ Diretório correto${NC}"
echo ""

# PASSO 1: Remover Cypress
echo -e "${YELLOW}1️⃣  Removendo Cypress...${NC}"
rm -f cypress.config.ts cypress.config.js 2>/dev/null || true
rm -rf cypress 2>/dev/null || true
echo -e "${GREEN}   ✅ Cypress removido${NC}"

# PASSO 2: Limpar
echo -e "${YELLOW}2️⃣  Limpando node_modules...${NC}"
rm -rf node_modules package-lock.json 2>/dev/null || true
echo -e "${GREEN}   ✅ Limpo${NC}"

# PASSO 3: Corrigir layout.tsx usando Python (mais seguro que sed)
echo -e "${YELLOW}3️⃣  Corrigindo src/app/layout.tsx...${NC}"

python3 << 'PYTHON'
import re

# Ler arquivo
with open('src/app/layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove import { Inter, Montserrat } from 'next/font/google'
content = re.sub(
    r"import\s*{\s*Inter\s*,\s*Montserrat\s*}\s*from\s*['\"]next/font/google['\"][\n]*",
    "",
    content
)

# 2. Remove const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
content = re.sub(
    r"const\s+inter\s*=\s*Inter\s*\(\s*{[^}]*}\s*\)[\n]*",
    "",
    content
)

# 3. Remove const montserrat = Montserrat({ ... })
content = re.sub(
    r"const\s+montserrat\s*=\s*Montserrat\s*\(\s*\{[^}]*}\s*\)[\n]*",
    "",
    content
)

# 4. Remove linhas órfãs que sobraram (subsets, variable, weight, })
content = re.sub(r"^\s*subsets:\s*\['latin'\],?[\n]*", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*variable:\s*'[^']*',?[\n]*", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*weight:\s*\[.*?\],?[\n]*", "", content, flags=re.MULTILINE)
content = re.sub(r"^\s*\}\)[\n]*", "", content, flags=re.MULTILINE)

# 5. Remove className com inter.variable e montserrat.variable
content = re.sub(
    r'className=\{\s*`\$\{inter\.variable\}\s*\$\{montserrat\.variable\}`\s*\}',
    "",
    content
)

# 6. Remove linhas comentadas de Google Fonts
content = re.sub(r"//\s*import\s*{.*?Google Fonts.*?\n", "", content)
content = re.sub(r"//\s*const (inter|montserrat).*?\n", "", content, flags=re.IGNORECASE)

# 7. Adiciona comentário se não existir
if "Google Fonts" not in content:
    # Encontra a linha de imports e adiciona comentário após
    content = re.sub(
        r"(import\s+{\s*VisualPreferencesProvider\s*}\s+from.*?\n)",
        r"\1\n// Google Fonts removido - não disponível em build do Vercel\n",
        content
    )

# 8. Remove linhas vazias extras
content = re.sub(r'\n\n\n+', '\n\n', content)

# Salvar
with open('src/app/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo corrigido com sucesso")
PYTHON

echo -e "${GREEN}   ✅ src/app/layout.tsx corrigido${NC}"

# PASSO 4: npm install
echo -e "${YELLOW}4️⃣  Instalando dependências...${NC}"
npm install --legacy-peer-deps --quiet 2>&1 | tail -2
echo -e "${GREEN}   ✅ npm pronto${NC}"

# PASSO 5: Build
echo -e "${YELLOW}5️⃣  Testando build...${NC}"
echo -e "${BLUE}   (Pode levar 30-40 segundos)${NC}"
echo ""

if npm run build > /tmp/build.log 2>&1; then
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║       ✅ BUILD SUCESSO! PRONTO PARA DEPLOY!                   ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}Próximo passo:${NC}"
  echo "  ${YELLOW}git add .${NC}"
  echo "  ${YELLOW}git commit -m \"fix: remove google fonts and cypress\"${NC}"
  echo "  ${YELLOW}git push origin main${NC}"
  echo ""
  echo -e "${GREEN}Vercel fará deploy em 2-3 minutos!${NC}"
  echo -e "${GREEN}Smart TV atualizará em seguida! 🎬🍿${NC}"
  echo ""
else
  echo ""
  echo -e "${RED}❌ Build falhou${NC}"
  echo -e "${BLUE}Log completo:${NC}"
  cat /tmp/build.log | tail -20
  exit 1
fi
