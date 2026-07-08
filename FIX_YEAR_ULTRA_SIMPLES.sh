#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 CORRIGIR YEAR — Ultima Correção TypeScript                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Corrigindo arquivo search/page.tsx..."

python3 << 'PYTHON'
# Abrir search/page.tsx e procurar pela linha com year
filepath = 'src/app/search/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir a linha específica
# De: year={item.year || item.ano || new Date().getFullYear()}
# Para: year={Number(item.year || item.ano || new Date().getFullYear())}

content = content.replace(
    'year={item.year || item.ano || new Date().getFullYear()}',
    'year={Number(item.year || item.ano || new Date().getFullYear())}'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("   ✅ search/page.tsx corrigido")
PYTHON

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ YEAR CORRIGIDO - PRONTO PARA BUILD!           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

