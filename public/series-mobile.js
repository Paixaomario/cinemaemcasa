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
// LOGICA DE RENDERIZAÇÃO
// ===========================
function setupEpisodeClick() {
  const items = document.querySelectorAll(".episode-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const title = item.querySelector("strong")?.textContent || "Episódio";
      showToast(`Reproduzindo: ${title}`);
    });
  });
}

// Evento de mudança temporada
if (safe(seasonSelect)) {
  seasonSelect.addEventListener("change", () => {
    // O React já lida com a mudança de estado e re-renderiza o DOM,
    // aqui apenas notificamos o usuário e re-aplicamos eventos se necessário.
    showToast(`Temporada ${seasonSelect.options[seasonSelect.selectedIndex].text} carregada`);
    
    // Timeout pequeno para garantir que o React terminou de renderizar os novos episódios
    setTimeout(setupEpisodeClick, 100);
  });
}

// Inicialização
window.addEventListener('load', () => {
    setupEpisodeClick();
});

// Observador de mutação para quando o React trocar os episódios via seletor
if (safe(episodesList)) {
    const observer = new MutationObserver(() => setupEpisodeClick());
    observer.observe(episodesList, { childList: true });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && safe(toast)) toast.classList.remove("show");
});