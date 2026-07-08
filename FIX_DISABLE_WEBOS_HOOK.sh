#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🔧 DESABILITAR useWebOSFocus — Debugar erro                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "package.json" ]; then
  echo "❌ Erro: Você não está na pasta correta!"
  exit 1
fi

echo "✓ Diretório correto"
echo ""

echo "1️⃣  Desabilitando useWebOSFocus em page.tsx..."

python3 << 'PYTHON'
import os

filepath = 'src/app/page.tsx'

if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Comentar a linha que usa useWebOSFocus
    content = content.replace(
        'useWebOSFocus(containerRef);',
        '// useWebOSFocus(containerRef); // DESABILITADO PARA DEBUG'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ useWebOSFocus desabilitado temporariamente")
else:
    print(f"   ❌ {filepath} não encontrado")

PYTHON

echo ""
echo "2️⃣  Desabilitando em outras páginas..."

python3 << 'PYTHON'
import os

for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            if 'useWebOSFocus(' in content:
                print(f"   Desabilitando: {filepath}")
                
                # Comentar chamada
                content = content.replace(
                    'useWebOSFocus(containerRef);',
                    '// useWebOSFocus(containerRef); // DEBUG'
                )
                
                content = content.replace(
                    'useWebOSFocus(ref);',
                    '// useWebOSFocus(ref); // DEBUG'
                )
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("   ✅ Todas as páginas atualizadas")
PYTHON

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✅ useWebOSFocus DESABILITADO!                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo: npm run build"
echo ""

