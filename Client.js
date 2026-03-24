const socket = io({ autoConnect: true });

let user = "";
let roomID = "unset";
let lastConnectError = null;

socket.on("connect", () => {
  lastConnectError = null;
});

socket.on("connect_error", (error) => {
  lastConnectError = error;
});

async function connectToRoom(RID, UID) {
  if (roomID !== "unset" || RID === "unset") return false;
  if (!socket.connected || lastConnectError) return false;

  try {
    user = await new Promise((resolve, reject) => {
      socket.emit("validate", { room: RID, user: UID }, (response) => {
        if (response === undefined) reject(new Error("Timeout or no response"));
        else resolve(response);
      });
    });
  } catch (e) {
    user = "";
    return false;
  }

  roomID = RID;
  socket.emit("updateInfo", { room: roomID, user });
  socket.emit("message", { text: `${user} has joined the room` });
  return true;
}

async function leaveRoom() {
  if (roomID === "unset") return;

  socket.emit("message", { text: `${user} has left the room` });
  socket.emit("updateInfo", { room: "unset", user: "" });
  roomID = "unset";
  user = "";
}

async function sendToRoom(message) {
  if (roomID === "unset") throw new Error("User is not in a room");
  socket.emit("message", { text: `${user}: ${message}` });
}

socket.on("message", (data) => {
  window.onChatMessage && window.onChatMessage(data);
});

window.chatClient = { connectToRoom, leaveRoom, sendToRoom };
window.getUser = () => user;
window.getRoomID = () => roomID;
window.getLastConnectError = () => lastConnectError;
