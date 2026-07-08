#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔧 CORRIGIR ContentCard — Mover para local correto        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

# PASSO 1: Criar pasta ui se não existir
echo "1️⃣  Criando pasta src/components/ui..."
mkdir -p src/components/ui
echo "   ✅ Pasta criada"
echo ""

# PASSO 2: Mover ContentCard para pasta correta
echo "2️⃣  Movendo ContentCard para local correto..."
if [ -f "src/components/ContentCard.tsx" ]; then
  mv src/components/ContentCard.tsx src/components/ui/ContentCard.tsx
  echo "   ✅ ContentCard movido para: src/components/ui/ContentCard.tsx"
else
  echo "   ⚠️  ContentCard.tsx não encontrado em src/components/"
fi
echo ""

# PASSO 3: Atualizar imports em page.tsx
echo "3️⃣  Atualizando import em src/app/page.tsx..."
if [ -f "src/app/page.tsx" ]; then
  sed -i "s|from '@/components/ContentCard'|from '@/components/ui/ContentCard'|g" src/app/page.tsx
  echo "   ✅ Import atualizado em page.tsx"
fi
echo ""

# PASSO 4: Verificar e corrigir outros arquivos que usam ContentCard
echo "4️⃣  Procurando por outros arquivos com ContentCard..."

# Array de arquivos que podem usar ContentCard
files=(
  "src/app/home/page.tsx"
  "src/app/buscar/page.tsx"
  "src/app/detalhes/[id]/page.tsx"
  "src/app/search/page.tsx"
  "src/app/series/[id]/page.tsx"
  "src/app/HomeClient.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Se o arquivo existe E contém ContentCard, atualiza o import
    if grep -q "ContentCard" "$file" 2>/dev/null; then
      # Se não tem o import correto, adiciona
      if ! grep -q "@/components/ui/ContentCard" "$file"; then
        sed -i "s|from '@/components/ContentCard'|from '@/components/ui/ContentCard'|g" "$file"
        sed -i "s|from '@/components/ui/ContentCard'|from '@/components/ui/ContentCard'|g" "$file"
        echo "   ✅ $file corrigido"
      fi
    fi
  fi
done

echo ""

# PASSO 5: Limpar arquivo antigo se ainda existir
echo "5️⃣  Limpando arquivos antigos..."
rm -f src/components/ContentCard.tsx 2>/dev/null || true
echo "   ✅ Limpeza concluída"
echo ""

# PASSO 6: Testar se não há mais erros de import
echo "6️⃣  Verificando estrutura..."
if [ -f "src/components/ui/ContentCard.tsx" ]; then
  echo "   ✅ src/components/ui/ContentCard.tsx existe"
else
  echo "   ❌ ContentCard.tsx não encontrado!"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ TUDO CORRIGIDO!                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo:"
echo "  npm run build  (testar build)"
echo ""

