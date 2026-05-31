# 🎬 WebOS TV - Guia Completo

## 📺 Estado Atual WebOS

**O que foi feito:** ✅ D-Pad detection + básico
**O que falta:** Otimizações completas + testes

---

## 🎮 Navegação D-Pad (Prioridade: ALTA)

### Implementado ✅
```typescript
// SearchSuggestions.tsx
- Detecta D-Pad automaticamente
- ↑ = scroll up
- ↓ = scroll down
- ← = voltar
- → = avançar
- OK = selecionar
```

### Testar em WebOS
```
1. Ligar TV LG WebOS
2. Abrir app Cinema em Casa
3. Ir a /search
4. Aperta na Magic Remote:
   🔴 RED - Não há ação (para futuro)
   🟢 GREEN - Não há ação (para futuro)
   🟡 YELLOW - Não há ação (para futuro)
   🔵 BLUE - Settings
   ↑ Scroll suggestions up
   ↓ Scroll suggestions down
   OK Selecionar sugestão
   ← Voltar
```

---

## 📐 Safe Area (Prioridade: MÉDIA)

### O que é?
Na TV, não usar as bordas da tela (4-8% das extremidades podem estar cortadas).

### Implementar:

**`src/app/search/page.tsx`**
```typescript
// Adicionar no container principal
const containerClass = `
  px-[4%] py-[4%]  /* Margins de segurança */
  sm:px-[3%] sm:py-[3%]
  lg:px-[2%] lg:py-[2%]
`;
```

**`src/globals.css`**
```css
/* Safe area para WebOS */
@media (min-width: 1920px) {
  .webos-safe-area {
    padding: max(env(safe-area-inset-top), 40px)
             max(env(safe-area-inset-right), 80px)
             max(env(safe-area-inset-bottom), 40px)
             max(env(safe-area-inset-left), 80px);
  }
}

@supports (padding: max(env(safe-area-inset-top))) {
  body.webos {
    padding: env(safe-area-inset-top)
             env(safe-area-inset-right)
             env(safe-area-inset-bottom)
             env(safe-area-inset-left);
  }
}
```

---

## 🔤 Tipografia WebOS (Prioridade: ALTA)

### Fonte Legível de Longe
```css
/* src/globals.css */

@media (min-width: 1920px) {
  body.webos {
    font-size: 20px;  /* De 16px */
  }
  
  h1 {
    font-size: 48px;  /* De 36px */
  }
  
  h2 {
    font-size: 36px;
  }
  
  button, a {
    font-size: 20px;  /* Min 18px */
  }
}

@media (min-width: 3840px) {
  /* 4K */
  body.webos {
    font-size: 28px;
  }
  
  h1 {
    font-size: 64px;
  }
  
  button {
    min-height: 64px;
    padding: 16px 32px;
  }
}
```

---

## 🎯 Focus Visual (Prioridade: ALTA)

### Problema
Mouse não existe na TV. Tudo é navegação D-Pad.
Precisa de **visual claro** para saber qual item está selecionado.

### Solução:

**`src/components/SearchSuggestions.tsx`**
```typescript
// Item selecionado tem border brilhante
<div className={`
  p-4
  border-2
  rounded-lg
  transition-all
  ${isHighlighted 
    ? 'border-yellow-400 shadow-lg shadow-yellow-500 bg-yellow-500/10'
    : 'border-gray-600 hover:border-gray-400'
  }
  ${isWebOS && isHighlighted && 'ring-4 ring-yellow-400/50'}
`}>
  {item.text}
</div>
```

### Cores WebOS Padrão
```
🔴 RED = Perigoso / Deletar / Não
🟢 GREEN = Confirmar / Sim / Voltar
🟡 YELLOW = Info / Highlight
🔵 BLUE = Settings / Detalhes
```

---

## 🖼️ Imagens Otimizadas (Prioridade: MÉDIA)

### Tamanho para WebOS
```typescript
// src/app/search/page.tsx
<Image
  src={poster}
  width={1920 / 7}   /* ~274px em 7-col grid */
  height={(1920 / 7) * 1.5}
  quality={85}
  priority={false}   /* Lazy load OK */
  className="object-cover rounded-lg"
/>
```

### Format Moderno
```typescript
<picture>
  <source srcSet="poster.webp" type="image/webp" />
  <img src="poster.jpg" alt="..." />
</picture>
```

---

## 🎬 Magic Remote (Prioridade: MÉDIA)

### RGB Keys (Futuro)
```typescript
// src/components/WebOSMagicRemote.tsx (novo)

interface MagicRemoteKey {
  RED?: () => void;
  GREEN?: () => void;
  YELLOW?: () => void;
  BLUE?: () => void;
}

export function useWebOSMagicRemote(keys: MagicRemoteKey) {
  useEffect(() => {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      switch(e.keyCode) {
        case 403: // RED
          keys.RED?.();
          break;
        case 404: // GREEN
          keys.GREEN?.();
          break;
        case 405: // YELLOW
          keys.YELLOW?.();
          break;
        case 406: // BLUE
          keys.BLUE?.();
          break;
      }
    });
  }, [keys]);
}
```

### Soft Buttons (Bottom of Screen)
```typescript
// src/components/WebOSOSKButtons.tsx (novo)

export function WebOSOSKButtons() {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 webos-safe-area">
      <div className="flex gap-4 justify-between">
        <button className="bg-red-600">🔴 RED: Search</button>
        <button className="bg-green-600">🟢 GREEN: Popular</button>
        <button className="bg-yellow-600">🟡 YELLOW: History</button>
        <button className="bg-blue-600">🔵 BLUE: Settings</button>
      </div>
    </div>
  );
}
```

---

## ⚡ Performance WebOS (Prioridade: ALTA)

### 60 FPS Smooth (Não 30 FPS)
```css
/* Use GPU acceleration */
.webos-scroll {
  transform: translateZ(0);  /* Force GPU */
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### Reduzir Renderizações
```typescript
// SearchSuggestions.tsx
const MemoizedSuggestion = memo(({ item }) => (
  <div>{item.text}</div>
));

// Virtual scrolling para 1000+ items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={suggestions.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {suggestions[index].text}
    </div>
  )}
</FixedSizeList>
```

---

## 📋 Checklist WebOS

### Build Time
- [ ] Testar em WebOS emulator (Chrome DevTools)
- [ ] Remote keyboard simulation
- [ ] D-Pad navigation: ↑↓←→OK

### Runtime Checks
- [ ] Conectar TV LG WebOS real (se disponível)
- [ ] Testar Magic Remote RGB
- [ ] Voice reconhecimento em português
- [ ] Geolocation localiza Brasil correto
- [ ] Storage persiste entre reloads
- [ ] Performance 60 FPS smooth

### UX/UI
- [ ] Fonte legível de 2-3 metros
- [ ] Focus visual óbvio
- [ ] Sem conteúdo cut off (safe area)
- [ ] Cores vibrantes para TV
- [ ] Icons grandes (64px+ em 4K)

---

## 🛠️ Setup Local (Emulador)

### Opção 1: WebOS Simulator

```bash
# 1. Download
https://developer.lge.com/develop/webos-tv/developer-tools/

# 2. Install emulator

# 3. Deploy app
npm run webos:deploy

# 4. Testar
- Open emulator
- Remote simulation
```

### Opção 2: Chrome DevTools Mode

```bash
# Simular 4K WebOS
1. DevTools → Device toolbar
2. Add custom device:
   - Name: "LG WebOS 4K"
   - Width: 1920px
   - Height: 1080px (ou 2160 para 4K)
3. User agent:
   "Mozilla/5.0 (webOS; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36 LG Browser/4.0 LGE-WEBOS-TZ"
```

---

## 🎯 Mapa de Telas WebOS

```
┌─────────────────────────────────┐
│  Cinema em Casa - WebOS Apps    │
├─────────────────────────────────┤
│  [🔴] [HOME] Cinema   [🔵]      │
├─────────────────────────────────┤
│                                 │
│  🎤 Voice Search                │
│  ┌──────────────────────────┐   │
│  │ Buscar filmes...         │   │
│  ├──────────────────────────┤   │
│  │ > Avatar                 │   │
│  │ > Ação                   │   │
│  │ > Aventura               │   │
│  └──────────────────────────┘   │
│                                 │
│  Filtros: [Filmes] [Séries]     │
│  Gêneros: [Ação] [Aventura]...  │
│                                 │
├─────────────────────────────────┤
│  🔴 RED  🟢 GREEN 🟡 YELLOW 🔵 │
└─────────────────────────────────┘
```

---

## 🚨 WebOS Common Issues

### Issue 1: D-Pad não funciona
**Cause:** Evento keydown não registrado
**Fix:**
```typescript
document.addEventListener('keydown', handler, true);  // Use capture!
```

### Issue 2: Voice não funciona
**Cause:** Perfis WebOS diferentes
**Fix:**
```typescript
// Verificar suporte
const isWebOSSupported = 
  'webkitSpeechRecognition' in window ||
  'SpeechRecognition' in window;

if (!isWebOSSupported) {
  console.log('Use text search on this device');
}
```

### Issue 3: Imagens cortadas
**Cause:** Safe area não considerada
**Fix:**
```css
.container {
  padding: max(env(safe-area-inset-top), 40px) ...;
}
```

### Issue 4: Performance lenta
**Cause:** Muitas renderizações
**Fix:**
```typescript
// Use memo + useDeferredValue
const [deferredSuggestions] = useDeferredValue(suggestions);
```

---

## 📚 Referência WebOS

### Keyboard Codes
```
keyCode 13 = Enter/OK
keyCode 37 = Left Arrow
keyCode 38 = Up Arrow
keyCode 39 = Right Arrow
keyCode 40 = Down Arrow
keyCode 27 = ESC/BACK
keyCode 403 = RED
keyCode 404 = GREEN
keyCode 405 = YELLOW
keyCode 406 = BLUE
keyCode 70 = FastForward
keyCode 71 = Rewind
```

### API WebOS Nativo
```typescript
// src/lib/webosNative.ts

export const webOS = {
  // Informações do sistema
  systemInfo: () => ({
    model: window.webOS?.systemInfo?.model,
    version: window.webOS?.systemInfo?.version,
  }),
  
  // Launch app
  launchApp: (id: string) => {
    window.webOS?.service?.launch?.request({
      service: 'luna://com.palm.launcher',
      payload: { id }
    });
  },
};
```

---

## ✅ Roadmap WebOS

### Fase 1: Ativa (HOJE)
- [x] D-Pad detection
- [x] Componentes responsivos
- [ ] Safe area styling
- [ ] Font sizing para TV
- [ ] Focus visual

### Fase 2: Média (Esta semana)
- [ ] Magic Remote RGB keys
- [ ] Performance profiling
- [ ] WebOS emulator testes
- [ ] Error handling native

### Fase 3: Futura
- [ ] WebOS service APIs
- [ ] Push notifications
- [ ] Cordova plugins
- [ ] App store deploy

---

## 🎁 Bônus: Multi-TV Setup

```typescript
// Para casas com múltiplas TVs

export function useMultiDevice() {
  const [devices, setDevices] = useState<WebOSDevice[]>([]);
  
  // Conectar a múltiplas TVs na rede
  useEffect(() => {
    discoveryDevices();  // UPnP discovery
  }, []);
  
  return {
    sendToTV: (tvId: string, action: string) => {
      // Enviar comando
    },
  };
}
```

---

**WebOS é uma plataforma especial que requer atenção extra!**

Prioridades:
1. Safe area + font size (visual)
2. D-Pad smooth (navigation)
3. Performance 60 FPS (smoothness)
4. Focus visual (UX)
5. Magic Remote RGB (polish)

Próximo passo? Testar em WebOS emulator! 📺
