'use client';

const RAPIDOS = ['😂', '🔥', '🍿', '❤️', '😮', '👏'];

const TODOS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😴',
  '😢', '😭', '😱', '😡', '🥳', '😎', '🤩', '🙌', '👏', '👍',
  '👎', '🍿', '🔥', '❤️', '💔', '😮', '😅', '🤯', '👻', '🎬'
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Agente de emoji: reações rápidas + seletor completo. Emojis podem ser
// enviados sozinhos ou junto com texto, respeitando o limite de 2 linhas
// aplicado no PartyChat.
export function EmojiPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-12 right-0 bg-panel border border-border rounded-card p-3 w-[220px] shadow-lg z-20">
      <div className="flex gap-1.5 mb-2 pb-2 border-b border-border">
        {RAPIDOS.map((e) => (
          <button
            key={e}
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="focusable emoji-fonte text-[30px]"
            aria-label={`Enviar reação ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1.5 max-h-[140px] overflow-y-auto">
        {TODOS.map((e) => (
          <button
            key={e}
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="focusable emoji-fonte text-[27px]"
            aria-label={`Enviar emoji ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
