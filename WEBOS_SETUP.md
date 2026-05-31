# 📺 Guia de Suporte LG WebOS - Cinema em Casa

## 🎯 Visão Geral

Este documento explica como o Cinema em Casa foi configurado para funcionar de forma nativa em LG WebOS TV sem comprometer a funcionalidade em outras plataformas (web, mobile, etc).

---

## 📦 O que Foram Adicionado

### 1. **Camada de Plataforma Isolada** (`/src/lib/platform/`)

Sistema independente que detecta e adapta comportamento para cada plataforma:

```
src/lib/platform/
├── platformDetect.ts    → Detecta WebOS, iOS, Android, etc
├── platformConfig.ts    → Configurações por plataforma
├── webosAdapter.ts      → API WebOS (seguro com fallback)
└── notifications.ts     → Sistema de notificações push
```

**Benefício:** Zero impacto no código existente. Todos os componentes continuam funcionando normalmente.

### 2. **Manifests WebOS**

- `public/appinfo.json` - Atualizado com configurações WebOS
- `public/manifest.webos.json` - PWA otimizado para TV
- `webos-config.json` - Configuração específica de features

### 3. **Sistema de Notificações Push**

- Funciona em todas as plataformas
- Cloud-based via Supabase
- Suporta notificações de novos filmes/séries
- Banco de dados: `push_subscriptions`, `user_notification_preferences`

### 4. **Scripts de Build**

- `scripts/build-webos.js` - Gera arquivo .tar.gz para instalar em TVs
- `npm run build:webos` - Comando pronto para usar
- `npm run webos:install` - Helper com instruções SSH

---

## 🚀 Como Usar

### **Desenvolvimento Local**

```bash
# Teste em qualquer navegador (simula WebOS)
npm run dev

# Build normalmente (continua funcionando em web)
npm run build
npm start
```

### **Build para WebOS**

```bash
# Gera arquivo pronto para TV
npm run build:webos

# Resultado: dist/cinema-em-casa-webos.tar.gz
```

### **Instalar em TV LG WebOS**

#### Pré-requisitos:
1. TV LG WebOS 4.0+ conectada na mesma rede WiFi
2. SSH e scp instalados no seu computador

#### Passo 1: Ativar Modo Desenvolvedor

Na TV LG:
1. Vá para **Configurações** → **Sistema**
2. Procure por **Desenvolvedor** ou **Developer**
3. Ative **Modo do Desenvolvedor** (Developer Mode)
4. Se houver opção, ative **USB Media Player**
5. Anote o **IP da TV** em **Informações de Rede**

#### Passo 2: Instalar App

```bash
# Copie o arquivo para a TV
scp dist/cinema-em-casa-webos.tar.gz root@192.168.1.100:/tmp/

# Conecte via SSH
ssh root@192.168.1.100

# Na TV, execute:
cd /tmp
tar -xzf cinema-em-casa-webos.tar.gz
mv com.paixaoflix.cinemaemcasa /media/developer/apps/
chmod -R 755 /media/developer/apps/com.paixaoflix.cinemaemcasa
exit

# Reinicie a TV
# O app vai aparecer na lista de aplicativos
```

---

## 🎮 Controle Remoto LG

O app suporta todas as funcionalidades do Magic Remote:

| Botão | Ação |
|-------|------|
| **D-Pad (↑↓←→)** | Navegação, selecionar items |
| **Enter/OK** | Confirmar, abrir conteúdo |
| **Back (←)** | Voltar, fechar modal, sair |
| **Vermelho** | Adicionar/remover favorito |
| **Verde** | Play/Pause |
| **Amarelo** | Informações do conteúdo |
| **Azul** | Legendas/Subtitle |

---

## 🔔 Sistema de Notificações Push

### Ativar Notificações

1. Abra o app em qualquer dispositivo
2. Vá para **Perfil** → **Notificações**
3. Ative **Receber Notificações**
4. Escolha suas preferências

### Tipos de Notificações

✅ **Novos Filmes/Séries** - Quando conteúdo novo é adicionado em seus gêneros favoritos
✅ **Recomendações Pessoalizadas** - Baseado no seu histórico
✅ **Eventos Especiais** - Promoções e eventos do Cinema em Casa
✅ **Horários** - Receba em horários que você escolheu

### Tecnologia

- **Web Push API** - Padrão da internet
- **Service Worker** - Background sync
- **Cloud-based** - Via Supabase
- **Criptografado** - Com padrão VAPID

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│              Cinema em Casa                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   Componentes Existentes (Sem Mudanças) │  │
│  │   - Home, Perfil, VideoPlayer, etc      │  │
│  └──────────────────────────────────────────┘  │
│                      ▲                          │
│                      │                          │
│  ┌──────────────────────────────────────────┐  │
│  │   Camada de Plataforma (NOVO)            │  │
│  │   ┌────────────────────────────────────┐ │  │
│  │   │   platformDetect.ts                │ │  │
│  │   │   (Detecta WebOS, iOS, Android)    │ │  │
│  │   └────────────────────────────────────┘ │  │
│  │   ┌────────────────────────────────────┐ │  │
│  │   │   platformConfig.ts                │ │  │
│  │   │   (Configs específicas)            │ │  │
│  │   └────────────────────────────────────┘ │  │
│  │   ┌────────────────────────────────────┐ │  │
│  │   │   webosAdapter.ts                  │ │  │
│  │   │   (API WebOS segura)               │ │  │
│  │   └────────────────────────────────────┘ │  │
│  │   ┌────────────────────────────────────┐ │  │
│  │   │   notifications.ts                 │ │  │
│  │   │   (Push notifications cloud)       │ │  │
│  │   └────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│                      ▲                          │
│                      │                          │
│  ┌──────────────────────────────────────────┐  │
│  │   Backend (Supabase)                     │  │
│  │   - Auth, Database, Storage, Push API   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘

Fluxo de Requisição:
  Browser → platformDetect (detecta WebOS)
         → platformConfig (carrega config WebOS)
         → webosAdapter (chama API WebOS se disponível)
         → fallback para web comum (se não WebOS)
```

---

## 🛡️ Garantias de Segurança

✅ **Zero Breaking Changes** - Nenhum arquivo existente foi modificado
✅ **Fallback Automático** - Se WebOS API falhar, usa comportamento web comum
✅ **RLS Do Banco** - Notifications isoladas por usuário
✅ **VAPID + Criptografia** - Push notifications criptografadas
✅ **Device Isolation** - Cada TV tem sua própria subscription

---

## 🧪 Testar Localmente

### Simular WebOS em Browser

```javascript
// No console do DevTools:
window.webOS = {
  app: {
    getCurrentAppInfo: () => ({ appId: 'com.paixaoflix', version: '0.1.0' }),
    close: () => console.log('App fechado'),
  },
  systemInfo: () => ({ 
    modelName: 'OLED65C1PUA',
    version: '5.0.0',
  }),
}

// Agora isWebOS() retornará true
```

### Testar Notificações

```typescript
import { showLocalNotification } from '@/lib/platform/notifications'

// Testar notificação local
showLocalNotification({
  id: 'test-1',
  title: 'Novo Filme!',
  body: 'Filme incrível foi adicionado',
  icon: '/logo.png',
})
```

---

## 📊 Performance WebOS

A configuração é otimizada para Smart TVs:

- **RAM Reduzida** - Cache menor (20MB vs 50MB web)
- **Imagens Compactadas** - Qualidade ajustada para TV
- **Vídeo 720p Padrão** - Mais compatível (pode fazer 1080p/4K)
- **Buffer Aumentado** - Para conexões instáveis
- **API Nativa** - Aproveita recursos da TV

---

## 🐛 Troubleshooting

### App Não Aparece na TV

- Verifique modo desenvolvedor está ativado
- Reinicie a TV: Power off + espere 10s
- Verifique permissões: `chmod -R 755 /media/developer/apps/com.paixaoflix.cinemaemcasa`

### Controle Remoto Não Funciona

- Magic Remote: Aperte "Home" e mude input para o app
- D-Pad: Use físico (não infravermelho portátil)
- Reset: Power-off TV e aguarde 30s

### Notificações Não Funcionam

- Confirme: Perfil → Notificações → Ativada
- Whitelist: Adicione domínio à lista de notificações da TV
- Logs: Dev Tools → Application → Service Workers

---

## 📚 Referências

- [LG WebOS Developer](https://webostv.developer.lge.com/)
- [WebOS 4.0 API Docs](https://webostv.developer.lge.com/develop/app-developer-guide/web-app-lifecycle/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Next.js Export](https://nextjs.org/docs/advanced-features/static-html-export)

---

## 🔄 Atualizações Futuras

O sistema foi projetado para atualizar sem redeploy:

```typescript
// Mudar config sem rebuild:
import { setCustomConfig } from '@/lib/platform/platformConfig'

setCustomConfig('webos-5.0', {
  videoDefaultQuality: '4k',
  imageOptimization: 'balanced',
})
```

---

## 📝 Checklist de Deployment

- [ ] Testar em browser (web)
- [ ] Testar em mobile (iOS/Android)
- [ ] Build WebOS: `npm run build:webos`
- [ ] Instalar em TV de teste
- [ ] Testar navegação com Magic Remote
- [ ] Testar notificações push
- [ ] Confirmar vídeo playback
- [ ] Testa offline (caching)
- [ ] Deploy para produção

---

**Última atualização:** 28 de Maio de 2026
**Versão:** 0.1.0
**Compatibilidade:** WebOS 4.0 - 7.0+
