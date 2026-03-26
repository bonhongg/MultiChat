// Assumes CommonJS module. Change this if not using CommonJS
const { io } = require("socket.io-client");

// This file should work the same as client.py, but is yet to be documented.

let user = "";
let roomID = "unset";

const socket = io();

async function connectToRoom(RID, UID) {
    if (roomID !== "unset" || RID === "unset"){
        return false;
    }
    
    try {
        user = await socket.timeout(5000).emitWithAck("validate", { "room": RID, "user": UID });
    } catch(err) {
        return false;
    }
    
    roomID = RID;
    socket.emit("updateInfo", { "room": roomID, "user": user });
    socket.emit("message", { "text": `${user} has joined the room` });
    
    return true;
}

async function leaveRoom() {
    socket.emit("message", {"text": `${user} has left the room`});
    socket.emit("updateInfo", { "room": "unset", "user": "" });
    roomID = "unset";
    user = "";
}

async function sendToRoom(message) {
    if (roomID == "unset") {
        throw new Error("User is not in a room");
    }
    socket.emit("message", { "text": `${user}: ${message}` });
}

socket.on("message", (data) => {
  console.log(data);
});

async function main(){ 
    socket.connect();
}

main();

// Assumes CommonJS module. Change this if not using CommonJS
module.exports = { connectToRoom, leaveRoom, sendToRoom }