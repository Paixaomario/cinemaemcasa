# Configuração PWA - Cinema em Casa

## O que foi implementado

### 1. Barra de Progresso com Cor do Logo ✅
- Cor atualizada para `#00ADEF` (cor do logo)
- Barra de progresso sólida com efeito shimmer
- Texto de status com a mesma cor

### 2. Manifest.json Atualizado ✅
- `theme_color` atualizado para `#00ADEF`
- Ícones em múltiplos tamanhos:
  - 72x72, 96x96, 128x128, 144x144, 152x152
  - 192x192, 384x384, 512x512
- Todos os ícones usam `/logo.png`
- `background_color` mantido como `#000000` (preto)
- `purpose: "any maskable"` para adaptar a diferentes formas

### 3. Layout.tsx Configurado ✅
- `manifest: '/manifest.json'` adicionado
- `themeColor` atualizado para `#00ADEF`
- `appleWebApp` configurado para iOS
- Ícones configurados para favicon e Apple Touch

### 4. Service Worker Atualizado ✅
- Versão do cache atualizada para `paixaoflix-v2`
- Lógica especial para ícones:
  - Sempre busca nova versão do servidor
  - Atualiza cache automaticamente
  - Garante que ícones sejam atualizados
- Logo.png incluído no cache estático

### 5. Registro do Service Worker ✅
- Componente `ServiceWorkerRegister` criado
- Registrado automaticamente no layout
- Console log para confirmar registro

## Como Funciona a Atualização de Ícones

### Service Worker com Cache Busting
O service worker tem uma lógica especial para ícones:

```javascript
// Sempre buscar novos ícones do servidor
if (e.request.url.includes('logo.png') || e.request.url.includes('icon')) {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Atualizar cache com nova versão
        const responseClone = response.clone()
        caches.open(CACHE).then(cache => {
          cache.put(e.request, responseClone)
        })
        return response
      })
      .catch(() => caches.match(e.request))
  )
}
```

Isso garante que:
1. Ícones são sempre buscados do servidor primeiro
2. Cache é atualizado com a nova versão
3. Se o servidor falhar, usa o cache

### Atualização Automática
Quando o usuário instala o PWA:
- Ícones são baixados e armazenados
- Service Worker monitora atualizações
- Nova versão do logo.png substitui a antiga
- Cache é invalidado automaticamente (v1 → v2)

## Como Testar

### 1. Instalar PWA
1. Abra o site no Chrome/Edge (desktop ou mobile)
2. Clique no ícone de instalação na barra de endereço
3. Clique em "Instalar" ou "Adicionar à tela inicial"

### 2. Verificar Ícones
- Verifique o ícone na tela inicial do dispositivo
- Verifique o ícone na lista de aplicativos
- Verifique o ícone na barra de tarefas (desktop)

### 3. Verificar Service Worker
1. Abra DevTools (F12)
2. Vá para Application > Service Workers
3. Verifique se o service worker está ativo
4. Verifique o console para mensagem de registro

### 4. Testar Atualização de Ícones
1. Instale o PWA
2. Substitua o `logo.png` com uma nova versão
3. Atualize a versão do cache no `sw.js` (v2 → v3)
4. Recarregue o aplicativo
5. O ícone deve ser atualizado automaticamente

### 5. Limpar Cache para Testar
Se precisar forçar atualização:
1. DevTools > Application > Storage
2. Clique em "Clear site data"
3. Recarregue a página
4. Service worker será reinstalado com novos ícones

## Cores do Sistema

### Cor do Logo
- **Hex:** `#00ADEF`
- **Nome:** Cyan/Azul
- **Usado em:**
  - Barra de progresso
  - Theme color do PWA
  - Cor de destaque

### Fundo
- **Hex:** `#000000`
- **Nome:** Preto
- **Usado em:**
  - Background color do PWA
  - Background da aplicação
  - Status bar (iOS)

## Compatibilidade

### Desktop
- ✅ Chrome/Edge (Windows, macOS, Linux)
- ✅ Instalação via barra de endereço
- ✅ Ícone na área de trabalho

### Mobile
- ✅ Android Chrome
- ✅ iOS Safari (com limitações)
- ✅ Instalação via "Adicionar à tela inicial"

### Smart TV
- ✅ Navegadores baseados em Chromium
- ⚠️ Pode não funcionar em TVs antigas

## Notas Importantes

### iOS Limitations
iOS Safari tem algumas limitações:
- Não suporta `beforeinstallprompt`
- Usuário deve adicionar manualmente via "Compartilhar"
- Ícones podem não atualizar imediatamente

### Cache Version
Sempre que atualizar o `sw.js`, incremente a versão:
```javascript
const CACHE = 'paixaoflix-v3' // v2 → v3
```

Isso força o service worker a atualizar o cache.

### Ícones Otimizados
Para melhor performance, considere criar versões otimizadas do logo:
- `icon-72.png`, `icon-96.png`, `icon-128.png`, etc.
- Use ferramentas como `squoosh.app` para otimizar
- Atualize o `manifest.json` para usar os ícones otimizados

## Solução de Problemas

### Ícones não atualizam
- Incremente a versão do cache no `sw.js`
- Limpe o cache do navegador
- Desinstale e reinstale o PWA

### Service Worker não registra
- Verifique o console para erros
- Certifique-se de que o site está em HTTPS
- Verifique se o arquivo `sw.js` está acessível

### PWA não instala
- Verifique se o site está em HTTPS
- Verifique se o `manifest.json` é válido
- Use DevTools > Manifest para validar

### Cor incorreta
- Verifique se `#00ADEF` está definido no `globals.css`
- Verifique se `themeColor` está atualizado no `layout.tsx`
- Limpe o cache e recarregue

## Arquivos Modificados

```
src/app/loading/page.tsx         # Barra de progresso atualizada
src/app/layout.tsx               # Manifest e themeColor configurados
public/manifest.json             # Ícones e themeColor atualizados
public/sw.js                     # Service worker atualizado
src/components/ServiceWorkerRegister.tsx  # NOVO - Registro do SW
```

## Próximas Melhorias (Opcionais)

- [ ] Criar ícones otimizados em diferentes tamanhos
- [ ] Adicionar splash screen personalizado
- [ ] Implementar atualização automática do app
- [ ] Adicionar notificações push
- [ ] Implementar modo offline completo
