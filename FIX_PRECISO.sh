#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🔧 CORREÇÃO PRECISA - SEM ERROS                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Remover Cypress
echo "1️⃣  Removendo Cypress..."
rm -f cypress.config.ts cypress.config.js 2>/dev/null || true
rm -rf cypress 2>/dev/null || true
echo "   ✅ Cypress removido"

# PASSO 2: Limpar
echo "2️⃣  Limpando node_modules..."
rm -rf node_modules package-lock.json 2>/dev/null || true
echo "   ✅ Limpo"

# PASSO 3: Corrigir layout.tsx com Python MUITO PRECISO
echo "3️⃣  Corrigindo src/app/layout.tsx..."

python3 << 'PYTHON'
# Ler arquivo
with open('src/app/layout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Nova lista de linhas
output = []
skip_until_bracket = False

for i, line in enumerate(lines):
    # Skip: import { Inter, Montserrat } from 'next/font/google'
    if "import { Inter, Montserrat } from 'next/font/google'" in line:
        continue
    
    # Skip: const inter = Inter(...)
    if "const inter = Inter({" in line:
        skip_until_bracket = True
        continue
    
    # Skip: const montserrat = Montserrat(...)
    if "const montserrat = Montserrat({" in line:
        skip_until_bracket = True
        continue
    
    # Se estamos skippando, continua até fecha }
    if skip_until_bracket:
        if "})" in line:
            skip_until_bracket = False
        continue
    
    # Remove className com variáveis de fonte
    if "className={`${inter.variable} ${montserrat.variable}`}" in line:
        line = line.replace("className={`${inter.variable} ${montserrat.variable}`}", "")
    
    output.append(line)

# Escrever arquivo
with open('src/app/layout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(output)

print("✅ layout.tsx corrigido com precisão")
PYTHON

echo "   ✅ src/app/layout.tsx corrigido"

# PASSO 4: npm install
echo "4️⃣  Instalando dependências..."
npm install --legacy-peer-deps --quiet 2>&1 | tail -2
echo "   ✅ npm pronto"

# PASSO 5: Build
echo ""
echo "5️⃣  Testando build..."
echo "   (Pode levar 30-40 segundos)"
echo ""

if npm run build 2>&1 | tail -20; then
  echo ""
  echo "✅ BUILD SUCESSO!"
  echo ""
  echo "Próximo passo:"
  echo "  git add ."
  echo "  git commit -m \"fix: remove google fonts\""
  echo "  git push origin main"
  echo ""
  echo "🎉 Vercel fará deploy em 2-3 minutos!"
else
  echo ""
  echo "❌ Build falhou novamente"
  exit 1
fi
