/* ============================================================
   APP — estado da interface + eventos (JS vanilla)
   ============================================================ */

const state = {
  view: "friends", // 'friends' | 'chat'
  serverId: null,
  channelId: null,
  dmId: null,
  friendsTab: "Online",
};

/* ---------- RENDER GERAL ---------- */

function renderAll() {
  renderRail(state.serverId);
  renderDMs($("global-search").value, state.dmId ? `dm-${state.dmId}` : null);

  $("btn-nav-friends").classList.toggle("nav-item--active", state.view === "friends");

  if (state.view === "friends") {
    renderHeader("👥", "Amigos", "Conecte-se com sua galera");
    renderHeaderActions([
      { icon: "✉", label: "Nova mensagem", onClick: () => $("global-search").focus() },
    ]);
    showView("view-friends");
    renderFriends(state.friendsTab);
    renderRight("friends");
    $("topbar-context").textContent = "Concord";
    return;
  }

  if (state.dmId) {
    const friend = FRIENDS.find((f) => f.id === state.dmId);
    renderHeader("", friend.name, `Status: ${friend.status}`);
    renderHeaderActions([]);
    showView("view-chat");
    renderMessages(MESSAGES, `dm-${state.dmId}`);
    renderRight("dm", friend);
    $("topbar-context").textContent = `Concord — ${friend.name}`;
    $("composer-input").placeholder = `Conversar com ${friend.name}`;
    return;
  }

  const server = SERVERS.find((s) => s.id === state.serverId);
  const channel = (CHANNELS[state.serverId] || []).find((c) => c.id === state.channelId);
  renderHeader(channel && channel.type === "text" ? "#" : "🔊", channel ? channel.name : server.name, "Conversas do servidor");
  renderHeaderActions([{ icon: "👥", label: "Membros", onClick: () => {} }]);
  showView("view-chat");
  renderMessages(MESSAGES, state.channelId);
  renderRight("members");
  $("topbar-context").textContent = `Concord — ${server.name}`;
  $("composer-input").placeholder = `Conversar em #${channel ? channel.name : server.name}`;
}

/* ---------- AÇÕES ---------- */

function goFriends() {
  state.view = "friends";
  state.dmId = null;
  renderAll();
}

function openServer(id) {
  const channels = CHANNELS[id] || [];
  const firstText = channels.find((c) => c.type === "text");
  if (!firstText) {
    // Servidor sem canais → estado vazio real (nada inventado).
    state.view = "friends";
    state.serverId = id;
    state.channelId = null;
    renderAll();
    $("view-friends").hidden = true;
    $("view-empty").hidden = false;
    $("header-title").textContent = SERVERS.find((s) => s.id === id).name;
    $("header-desc").textContent = "Nenhum canal neste servidor ainda";
    return;
  }
  state.view = "chat";
  state.serverId = id;
  state.channelId = firstText.id;
  state.dmId = null;
  renderAll();
}

function openDM(id) {
  state.view = "chat";
  state.dmId = id;
  state.serverId = null;
  renderAll();
}

/* ---------- MODAL ---------- */

function openModal() {
  $("modal-server").hidden = false;
  $("input-server-name").value = "";
  $("input-server-name").focus();
}
function closeModal() {
  $("modal-server").hidden = true;
}

function createServer() {
  const name = $("input-server-name").value.trim();
  if (!name) {
    $("input-server-name").focus();
    return;
  }
  const color = document.querySelector(".icon-option--active").dataset.color;
  const id = `s${Date.now()}`;
  SERVERS.push({ id, name, color });
  CHANNELS[id] = [];
  closeModal();
  openServer(id); // seleciona automaticamente; mostra estado vazio de canais
}

/* ---------- EVENTOS ---------- */

$("btn-nav-home").addEventListener("click", goFriends);
$("btn-nav-friends").addEventListener("click", goFriends);

$("server-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-server-id]");
  if (btn) openServer(btn.dataset.serverId);
});

$("dm-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-dm-id]");
  if (btn) openDM(btn.dataset.dmId);
});

$("friends-list").addEventListener("click", (e) => {
  const msgBtn = e.target.closest("[data-dm]");
  const row = e.target.closest("[data-dm-id]");
  if (msgBtn) {
    openDM(msgBtn.dataset.dm);
  } else if (row && !e.target.closest(".icon-btn")) {
    openDM(row.dataset.dmId);
  }
});

document.querySelectorAll(".friends-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".friends-tab").forEach((t) => t.classList.remove("friends-tab--active"));
    tab.classList.add("friends-tab--active");
    state.friendsTab = tab.textContent;
    renderFriends(state.friendsTab);
  });
});

$("global-search").addEventListener("input", (e) => {
  renderDMs(e.target.value, state.dmId ? `dm-${state.dmId}` : null);
});

$("composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("composer-input");
  const text = input.value.trim();
  if (!text) return;
  const key = state.dmId ? `dm-${state.dmId}` : state.channelId;
  if (!MESSAGES[key]) MESSAGES[key] = [];
  const now = new Date();
  MESSAGES[key].push({
    userId: "me",
    text,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  });
  input.value = "";
  renderMessages(MESSAGES, key);
});

$("btn-add-server").addEventListener("click", openModal);
$("btn-empty-create").addEventListener("click", openModal);
$("btn-empty-invite").addEventListener("click", () => alert("Protótipo: entrar com convite (sem backend)."));
$("btn-modal-close").addEventListener("click", closeModal);
$("btn-modal-cancel").addEventListener("click", closeModal);
$("btn-modal-create").addEventListener("click", createServer);
$("input-server-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") createServer();
});
$("modal-server").addEventListener("click", (e) => {
  if (e.target === $("modal-server")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

document.querySelectorAll(".icon-option").forEach((opt) => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".icon-option").forEach((o) => o.classList.remove("icon-option--active"));
    opt.classList.add("icon-option--active");
  });
});

/* ---------- INÍCIO ---------- */
renderAll();