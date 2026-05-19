// ======================================
// PAIXAOFLIX - SERIES DETALHES MOBILE V4
// ======================================

const seasonSelect = document.querySelector("#seasonSelect");
const episodesList = document.querySelector("#episodesList");
const favBtn = document.querySelector("#btnFavorito");
const laterBtn = document.querySelector("#btnAssistirDepois");
const toast = document.querySelector("#toast");

function safe(el) {
  return el !== null && el !== undefined;
}

function showToast(msg) {
  if (!safe(toast)) return;

  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ===========================
// FAVORITO / ASSISTIR DEPOIS
// ===========================
if (safe(favBtn)) {
  favBtn.addEventListener("click", () => {
    favBtn.classList.toggle("active");
    showToast(favBtn.classList.contains("active") ? "Adicionado aos Favoritos!" : "Removido dos Favoritos!");
  });
}

if (safe(laterBtn)) {
  laterBtn.addEventListener("click", () => {
    laterBtn.classList.toggle("active");
    showToast(laterBtn.classList.contains("active") ? "Adicionado para Assistir Depois!" : "Removido de Assistir Depois!");
  });
}

// ===========================
// TEMPORADAS (SIMULAÇÃO REAL)
// ===========================
const seasons = {
  "1": [
    { title: "Capítulo 1: O Início", duration: "52min", progress: 90 },
    { title: "Capítulo 2: A Jornada", duration: "48min", progress: 35 },
    { title: "Capítulo 3: O Segredo", duration: "55min", progress: 0 },
    { title: "Capítulo 4: A Verdade", duration: "50min", progress: 0 },
    { title: "Capítulo 5: O Caos", duration: "47min", progress: 0 },
  ],
  "2": [
    { title: "Capítulo 1: O Retorno", duration: "49min", progress: 70 },
    { title: "Capítulo 2: O Confronto", duration: "53min", progress: 0 },
    { title: "Capítulo 3: A Escolha", duration: "50min", progress: 0 },
    { title: "Capítulo 4: O Final", duration: "57min", progress: 0 },
  ]
};

function renderEpisodes(seasonKey) {
  if (!safe(episodesList)) return;

  episodesList.innerHTML = "";

  const list = seasons[seasonKey] || [];

  list.forEach((ep, index) => {
    const item = document.createElement("div");
    item.className = "episode-item";

    item.innerHTML = `
      <div class="ep-thumb" style="background-image:url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80')">
        <div class="ep-play">▶</div>
      </div>

      <div class="ep-info">
        <strong>${index + 1}. ${ep.title}</strong>
        <span>${ep.duration}</span>

        <div class="progress-bar">
          <div class="progress-fill" style="width:${ep.progress}%"></div>
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      showToast(`Reproduzindo: ${ep.title}`);
    });

    episodesList.appendChild(item);
  });
}

// Evento de mudança temporada
if (safe(seasonSelect)) {
  seasonSelect.addEventListener("change", () => {
    renderEpisodes(seasonSelect.value);
    showToast(`Temporada ${seasonSelect.value} carregada`);
  });
}

// Inicialização
if (safe(seasonSelect)) {
  renderEpisodes(seasonSelect.value);
}

// Fechar toast com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (safe(toast)) toast.classList.remove("show");
  }
});
