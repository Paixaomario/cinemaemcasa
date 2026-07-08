#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 REMOVER VideoPlayerThumbnails — Arquivo com erro           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Removendo VideoPlayerThumbnails.tsx corrompido..."

# Remover arquivo problemático
rm -f src/components/VideoPlayerThumbnails.tsx

echo "   ✅ VideoPlayerThumbnails.tsx removido"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ ARQUIVO CORROMPIDO REMOVIDO!                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo: npm run build"
echo ""

