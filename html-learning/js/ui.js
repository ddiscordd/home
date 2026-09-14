/* ============================================================
   UI — funções de renderização (só DOM, sem estado)
   ============================================================ */

const $ = (id) => document.getElementById(id);

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function avatar(user, sm) {
  return `<div class="avatar${sm ? " avatar--sm" : ""}" style="background:${user.color}">${user.name[0]}</div>`;
}

function statusBadge(status) {
  const cls = status === "offline" ? " nav-item__badge--offline" : status === "idle" ? " nav-item__badge--idle" : "";
  return `<span class="nav-item__badge${cls}" aria-hidden="true"></span>`;
}

/* ---------- SERVER RAIL ---------- */

function renderRail(activeId) {
  const list = $("server-list");
  list.innerHTML = "";
  SERVERS.forEach((server) => {
    const btn = el("button", "rail-btn" + (server.id === activeId ? " rail-btn--active" : ""));
    btn.textContent = server.name[0];
    btn.style.background = server.color;
    btn.title = server.name;
    btn.setAttribute("aria-label", server.name);
    btn.dataset.serverId = server.id;
    list.appendChild(btn);
  });
}

/* ---------- NAVEGAÇÃO LATERAL ---------- */

function renderDMs(filter, activeKey) {
  const list = $("dm-list");
  list.innerHTML = "";
  const term = (filter || "").toLowerCase();
  FRIENDS.filter((f) => f.name.toLowerCase().includes(term)).forEach((friend) => {
    const key = `dm-${friend.id}`;
    const btn = el(
      "button",
      "nav-item" + (key === activeKey ? " nav-item--active" : ""),
      `<span class="nav-item__avatar">${avatar(friend, true)}</span>
       <span class="nav-item__name">${friend.name}</span>${statusBadge(friend.status)}`,
    );
    btn.dataset.dmId = friend.id;
    list.appendChild(btn);
  });
}

function setActiveNav(idActive, idInactive) {
  const active = $(idActive);
  const inactive = $(idInactive);
  active.classList.add("nav-item--active");
  inactive.classList.remove("nav-item--active");
}

/* ---------- HEADER DO CONTEÚDO ---------- */

function renderHeader(icon, title, desc) {
  $("header-icon").textContent = icon;
  $("header-title").textContent = title;
  $("header-desc").textContent = desc;
}

function renderHeaderActions(buttons) {
  const wrap = $("header-actions");
  wrap.innerHTML = "";
  buttons.forEach((b) => {
    const btn = el("button", "icon-btn", b.icon);
    btn.setAttribute("aria-label", b.label);
    btn.title = b.label;
    btn.addEventListener("click", b.onClick);
    wrap.appendChild(btn);
  });
}

/* ---------- VIEWS ---------- */

function showView(id) {
  ["view-friends", "view-chat", "view-empty"].forEach((v) => {
    $(v).hidden = v !== id;
  });
}

function renderFriends(tab) {
  const wrap = $("friends-list");
  wrap.innerHTML = "";
  const online = FRIENDS.filter((f) => f.status !== "offline");
  const offline = FRIENDS.filter((f) => f.status === "offline");
  const groups = tab === "Todos" ? [{ label: "Todos", list: FRIENDS }] : [
    { label: `Online — ${online.length}`, list: online },
    { label: `Offline — ${offline.length}`, list: offline },
  ];
  groups.forEach((g) => {
    if (!g.list.length) return;
    wrap.appendChild(el("p", "friends-section", g.label));
    g.list.forEach((friend, i) => {
      const row = el(
        "button",
        "friend-row" + (friend.status === "offline" ? " friend-row--offline" : ""),
        `${avatar(friend, true)}
         <span>${friend.name}</span>
         <span class="friend-row__status">${friend.status === "idle" ? "ausente" : friend.status === "offline" ? "offline" : "online"}</span>
         <span class="friend-row__actions">
           <button class="icon-btn" aria-label="Mensagem para ${friend.name}" data-dm="${friend.id}">✉</button>
         </span>`,
      );
      row.style.animationDelay = `${i * 40}ms`;
      row.dataset.dmId = friend.id;
      wrap.appendChild(row);
    });
  });
}

function renderMessages(list, key) {
  const wrap = $("message-list");
  wrap.innerHTML = "";
  (list[key] || []).forEach((msg, i) => {
    const user = msg.userId === "me" ? ME : FRIENDS.find((f) => f.id === msg.userId) || ME;
    const row = el(
      "div",
      "message",
      `${avatar(user)}
       <div class="message__body">
         <div class="message__head">
           <strong>${user.name}</strong>
           <span class="message__time">${msg.time}</span>
         </div>
         <p class="message__text"></p>
       </div>`,
    );
    row.style.animationDelay = `${Math.min(i * 30, 150)}ms`;
    row.querySelector(".message__text").textContent = msg.text;
    wrap.appendChild(row);
  });
  wrap.scrollTop = wrap.scrollHeight;
}

function renderRight(kind, payload) {
  const wrap = $("right-content");
  wrap.innerHTML = "";
  if (kind === "empty") {
    wrap.appendChild(el("p", "right-empty", payload));
    return;
  }
  const online = FRIENDS.filter((f) => f.status !== "offline");
  wrap.appendChild(el("p", "right-section", kind === "dm" ? "Detalhes" : kind === "friends" ? "Ativos agora" : "Membros"));
  if (kind === "dm") {
    const user = payload;
    wrap.appendChild(el("div", "right-row", `${avatar(user, true)}<span>${user.name}</span><span class="right-row__note">${user.status}</span>`));
    return;
  }
  if (!payload.length) {
    wrap.appendChild(el("p", "right-empty", "Nenhum membro ainda."));
    return;
  }
  FRIENDS.filter((f) => f.status !== "offline").forEach((f) => {
    wrap.appendChild(el("div", "right-row", `${avatar(f, true)}<span>${f.name}</span><span class="right-row__note">${f.status}</span>`));
  });
}