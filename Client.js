let user = "";
let roomID = "unset";

//Abandoning CommonJS framework, im just relying on index.html to load Client.js via <script> tag
const socket = io(window.location.origin, { autoConnect: false });

//basically makes sure the Socket.IO client is connected before attempting to join a room
function waitForSocketConnection(timeout = 5000) {
    //if already connected, resolve
    if (socket.connected) {
        return Promise.resolve();
    }

    //returns a promise that resolves when the connection succeeds
    return new Promise((resolve, reject) => {

        //set a timeout to prevent waiting infinitely
        const timer = window.setTimeout(() => {
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleError);
            reject(new Error("Socket connection timed out"));
        }, timeout);

        //cleans up event listeners and timeout once finished
        function cleanup() {
            window.clearTimeout(timer);
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleError);
        }

        //only called when the connection is successful
        function handleConnect() {
            cleanup();
            resolve();
        }

        //only called in an event the connection fails
        function handleError(error) {
            cleanup();
            reject(error || new Error("Socket connection failed"));
        }

        //listens for connection success or connection failure
        socket.on("connect", handleConnect);
        socket.on("connect_error", handleError);
        socket.connect();
    });
}

//Validates if the username is valid and waits for the reply (Timeouts to avoid waiting forever)
function validateUser(RID, UID) {
    return new Promise((resolve, reject) => {

        //Timeout to avoid waiting for server response
        const timer = window.setTimeout(() => {
            reject(new Error("Username validation timed out"));
        }, 5000);

        //emits validation request to server with room + username
        //server responds via callback
        socket.emit("validate", { room: RID, user: UID }, (response) => {
            //clear timeout once response is received
            window.clearTimeout(timer);

            //resolves server response (could be a modified username or error
            resolve(response);
        });
    });
}

async function connectToRoom(RID, UID) {
    if (roomID !== "unset" || RID === "unset"){
        return false;
    }

    await waitForSocketConnection();
    user = await validateUser(RID, UID);

    roomID = RID;
    socket.emit("updateInfo", { room: roomID, user: user });
    socket.emit("message", { text: `${user} has joined the room` });

    return true;
}

async function leaveRoom() {
    socket.emit("message", { text: `${user} has left the room` });
    socket.emit("updateInfo", { room: "unset", user: "" });
    roomID = "unset";
    user = "";
}

async function sendToRoom(message) {
    if (roomID == "unset") {
        throw new Error("User is not in a room");
    }
    socket.emit("message", { text: `${user}: ${message}` });
}

socket.on("message", (data) => {
    //removed console.log(data) as it would not relay the message into the chat window; window.onChatMessage(data) makes
    //it so the message appears into the chat window
    if (typeof window.onChatMessage === "function") {
    window.onChatMessage(data);
    return;
  }
  console.log(data);
});

window.chatClient = { connectToRoom, leaveRoom, sendToRoom };
window.getRoomID = () => roomID;
window.getUser = () => user;
