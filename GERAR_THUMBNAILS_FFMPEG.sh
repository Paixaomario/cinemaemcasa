#!/bin/bash

# Script para gerar thumbnails de vídeo usando ffmpeg
# Uso: bash GERAR_THUMBNAILS_FFMPEG.sh <arquivo.mp4> [output_dir]
# Exemplo: bash GERAR_THUMBNAILS_FFMPEG.sh video.mp4 ./thumbnails

set -e

if [ -z "$1" ]; then
  echo "❌ Uso: $0 <arquivo.mp4> [output_dir]"
  echo "Exemplo: $0 meu_video.mp4 ./thumbnails"
  exit 1
fi

VIDEO_FILE="$1"
OUTPUT_DIR="${2:-./thumbnails}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      🎬 GERAR THUMBNAILS DE VÍDEO COM FFMPEG                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se ffmpeg está instalado
if ! command -v ffmpeg &> /dev/null; then
  echo "❌ ffmpeg não está instalado!"
  echo "Instale com: sudo apt-get install ffmpeg"
  exit 1
fi

echo "✓ ffmpeg encontrado"
echo ""

# Verificar se arquivo existe
if [ ! -f "$VIDEO_FILE" ]; then
  echo "❌ Arquivo não encontrado: $VIDEO_FILE"
  exit 1
fi

echo "📁 Arquivo: $VIDEO_FILE"
echo "📂 Output: $OUTPUT_DIR"
echo ""

# Criar diretório
mkdir -p "$OUTPUT_DIR"

# Obter duração do vídeo
echo "1️⃣  Obtendo informações do vídeo..."
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:nokey=1 "$VIDEO_FILE")
DURATION_INT=${DURATION%.*}

echo "   ⏱️  Duração: ${DURATION_INT}s"
echo ""

# Configurações
INTERVAL=5  # Extrair frame a cada 5 segundos
THUMBNAIL_WIDTH=160
THUMBNAIL_HEIGHT=90
COLUMNS=10  # 10 thumbnails por linha
ROWS=10    # 10 linhas (100 thumbnails total)

echo "2️⃣  Gerando thumbnails..."
echo "   Intervalo: ${INTERVAL}s"
echo "   Tamanho: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}"
echo "   Sprite: ${COLUMNS}x${ROWS}"
echo ""

# Gerar thumbnail sheet (sprite)
ffmpeg -i "$VIDEO_FILE" \
  -vf "fps=1/${INTERVAL},scale=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT},tile=${COLUMNS}x${ROWS}" \
  -y \
  "$OUTPUT_DIR/thumbnail_sprite.jpg" 2>&1 | grep -E "frame=|time=" | tail -1

echo ""
echo "   ✅ Sprite gerado: $OUTPUT_DIR/thumbnail_sprite.jpg"
echo ""

# Gerar arquivo JSON com metadados
echo "3️⃣  Gerando metadados..."

cat > "$OUTPUT_DIR/thumbnails.json" << JSONEOF
{
  "video_file": "$(basename "$VIDEO_FILE")",
  "duration": $DURATION_INT,
  "thumbnails": {
    "sprite_image": "thumbnail_sprite.jpg",
    "interval_seconds": $INTERVAL,
    "width": $THUMBNAIL_WIDTH,
    "height": $THUMBNAIL_HEIGHT,
    "columns": $COLUMNS,
    "rows": $ROWS,
    "total_frames": $(( ($DURATION_INT + $INTERVAL - 1) / $INTERVAL ))
  },
  "usage": {
    "description": "Use a imagem sprite com CSS background-position para mostrar thumbnails",
    "example_css": ".thumbnail { background: url('thumbnail_sprite.jpg'); width: 160px; height: 90px; }",
    "calculate_position": "Para tempo T segundos: frame_index = floor(T / interval_seconds); x = (frame_index % columns) * width; y = floor(frame_index / columns) * height; background-position: -xpx -ypx;"
  }
}
JSONEOF

echo "   ✅ Metadados gerados: $OUTPUT_DIR/thumbnails.json"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ THUMBNAILS GERADOS!                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Arquivos criados:"
echo "  - $OUTPUT_DIR/thumbnail_sprite.jpg (sprite com todos os frames)"
echo "  - $OUTPUT_DIR/thumbnails.json (metadados)"
echo ""
echo "🎯 Próximo passo:"
echo "  1. Salve a sprite em seu servidor/storage"
echo "  2. Quando usuário arrastar barra, calcule frame_index"
echo "  3. Use CSS background-position para mostrar thumbnail"
echo ""
echo "📖 Ver arquivo HTML de exemplo:"
echo "  cat EXEMPLO_PLAYER_COM_THUMBNAILS.html"
echo ""

