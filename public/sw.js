// Service Worker Básico para PWA

// O evento 'install' é acionado quando o service worker é instalado.
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado.');
});

// O evento 'fetch' é crucial. A simples presença dele faz o app ser "instalável".
self.addEventListener('fetch', (event) => {
  // Não fazemos nada com a requisição, apenas a deixamos passar.
});