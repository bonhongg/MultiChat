//UI logic for the chat interface

function showError(msg) {
  const errorLog = document.getElementById("join-error");
  errorLog.textContent = msg;
  errorLog.classList.add("visible");
}

function clearError() {
  const errorLog = document.getElementById("join-error");
  errorLog.textContent = "";
  errorLog.classList.remove("visible");
}

function showChat() {
  document.getElementById("join-screen").style.display = "none";
  const cs = document.getElementById("chat-screen");
  cs.style.display = "flex";
  cs.style.animation = "fadeIn 0.35s ease";
  document.getElementById("header-room").textContent = window.getRoomID();
  document.getElementById("header-user").textContent = window.getUser();
  document.getElementById("msg-input").focus();
}

function showJoin() {
  document.getElementById("chat-screen").style.display = "none";
  const js = document.getElementById("join-screen");
  js.style.display = "flex";
  js.style.animation = "fadeIn 0.35s ease";
  document.getElementById("input-user").value = "";
  document.getElementById("input-room").value = "";
  clearError();
}

// Decides if a message is a system notice, self, or sent by another user
function classifyMessage(text) {
  const u = window.getUser();
  if (text.endsWith("has joined the room") || text.endsWith("has left the room")) return "system";
  if (text.startsWith(u + ":")) return "self";
  return "other";
}

function parseMessage(text) {
  const colon = text.indexOf(":");
  if (colon === -1) return { name: null, body: text };
  return { name: text.slice(0, colon).trim(), body: text.slice(colon + 1).trim() };
}

function appendMessage(text) {
  const wrap = document.getElementById("messages");
  const kind = classifyMessage(text);
  const div = document.createElement("div");
  div.classList.add("msg", kind);

  if (kind === "system") {
    div.textContent = text;
  } else {
    const { name, body } = parseMessage(text);
    if (name) {
      const nameEl = document.createElement("div");
      nameEl.classList.add("msg-name");
      nameEl.textContent = name;
      div.appendChild(nameEl);
    }
    const bodyEl = document.createElement("div");
    bodyEl.classList.add("msg-text");
    bodyEl.textContent = body || text;
    div.appendChild(bodyEl);
  }

  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

//Handlers

async function handleJoin() {
  const uid = document.getElementById("input-user").value.trim();
  const rid = document.getElementById("input-room").value.trim();
  const btn = document.getElementById("btn-join");

  if (!uid) { showError("Username is required."); return; }
  if (!rid) { showError("Room ID is required."); return; }
  if (rid === "unset") { showError('"unset" is a reserved room ID.'); return; }

  clearError();
  btn.disabled = true;
  btn.textContent = "Connecting…";

  try {
    const ok = await window.chatClient.connectToRoom(rid, uid);
    if (ok) {
      showChat();
      return;
    }
    showError("Could not join room. Try again.");
  } catch (error) {
    showError("Could not connect to the server. Try again.");
  }

  if (document.getElementById("join-screen").style.display !== "none") {
    btn.disabled = false;
    btn.textContent = "Join Room";
  }
}

async function handleLeave() {
  await window.chatClient.leaveRoom();
  document.getElementById("messages").innerHTML = "";
  showJoin();
}

async function handleSend() {
  const input = document.getElementById("msg-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await window.chatClient.sendToRoom(text);
}

//Incoming messages

window.onChatMessage = (data) => {
  appendMessage(data);
};

//Keyboard shortcuts

document.getElementById("input-user").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleJoin();
});

document.getElementById("input-room").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleJoin();
});
