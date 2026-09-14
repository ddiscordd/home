/* ============================================================
   DADOS MOCKADOS — separados da interface (como no projeto real)
   ============================================================ */

const ME = { id: "me", name: "Zynox", color: "#5865f2", status: "online" };

const FRIENDS = [
  { id: "f1", name: "Ana", color: "#23a55a", status: "online" },
  { id: "f2", name: "Bruno", color: "#3b82d8", status: "online" },
  { id: "f3", name: "Carla", color: "#e5a83b", status: "idle" },
  { id: "f4", name: "Diego", color: "#80848e", status: "offline" },
  { id: "f5", name: "Elisa", color: "#9a5cf0", status: "offline" },
];

const SERVERS = [
  { id: "s1", name: "Alpha", color: "#5865f2" },
  { id: "s2", name: "Amigos", color: "#23a55a" },
  { id: "s3", name: "Projeto", color: "#e5a83b" },
];

const CHANNELS = {
  s1: [
    { id: "c1", name: "geral", type: "text" },
    { id: "c2", name: "conversa", type: "text" },
    { id: "c3", name: "Sala Geral", type: "voice" },
    { id: "c4", name: "Sala de Jogos", type: "voice" },
  ],
  s2: [{ id: "c5", name: "zoeira", type: "text" }],
  s3: [{ id: "c6", name: "tarefas", type: "text" }],
};

const MESSAGES = {
  c1: [
    { userId: "f1", text: "Bem-vindo! Esse protótipo é HTML/CSS/JS puro.", time: "19:02" },
    { userId: "f2", text: "Layout bem denso, igual app desktop de verdade.", time: "19:04" },
    { userId: "me", text: "Topbar de 38px, rail de 66px, nav de 232px.", time: "19:05" },
  ],
  c2: [{ userId: "f1", text: "Fala aí!", time: "18:10" }],
  c5: [{ userId: "f2", text: "Alguém on?", time: "17:30" }],
  c6: [],
  "dm-f1": [
    { userId: "f1", text: "Oi! Vamos fechar o projeto hoje?", time: "16:40" },
    { userId: "me", text: "Bora!", time: "16:41" },
  ],
  "dm-f2": [{ userId: "f2", text: "Valeu pela ajuda 👍", time: "15:02" }],
  "dm-f3": [],
};