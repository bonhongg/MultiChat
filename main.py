import socketio
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# I'll be honest, no idea if this next import is necessary, but it seems useful
from fastapi.middleware.cors import CORSMiddleware

fastAPIApp = FastAPI()
fastAPIApp.add_middleware(CORSMiddleware, allow_origins=["*"])

BASE_DIR = Path(__file__).resolve().parent

# Serves the JS/CSS assets that currently live in the project root.
fastAPIApp.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

# Dict which stores Socket ID as key and [room, username] as value -> [roomid, username]
SIDDataTracker = {}
# Dict which stores existing usernames in a room -> [Bob, John, Bill]
roomUserTracker = {}

sessionID = socketio.AsyncServer(async_mode = 'asgi', cors_allowed_origins='*')

app = socketio.ASGIApp(sessionID, fastAPIApp)

@fastAPIApp.get("/")
async def read_index():
    return FileResponse(BASE_DIR / "index.html")

#waits for client connection and registers them with a placeholder value -> SIDDataTracker[sid] = [unset, ""(empty username)]
@sessionID.event
async def connect(sid, environ):
    """Normal connect, but also adds info to tracker array."""
    global SIDDataTracker
    SIDDataTracker[sid] = ["unset", ""]

#cleans up when a user client disconnects, also broadcasts a message saying that they have left the room
@sessionID.event
async def disconnect(sid):
    """Normal disconnect, but also removes info from tracker arrays."""
    global SIDDataTracker, roomUserTracker
    room = SIDDataTracker[sid][0]
    user = SIDDataTracker[sid][1]
    if not (SIDDataTracker[sid][0] == "unset"):
        await sessionID.emit("message", f"{user} has left the room", to=room)
        #deletes user and deletes room (if no ones left)
        roomUserTracker[room].remove(user)
        if not roomUserTracker[room]:
            del roomUserTracker[room]
    del SIDDataTracker[sid]

@sessionID.event
async def message(sid, data):
    """Sends message to all in client's room. Message should be recieved from here - no polling necessary."""
    global SIDDataTracker
    if (SIDDataTracker[sid][0] == "unset"):
        raise Exception("User is not in a room")
    #to= indicates the room
    await sessionID.emit("message", data["text"], to=SIDDataTracker[sid][0])

@sessionID.event
async def updateInfo(sid, data):
    """Updates usernames and room IDs on the tracker. Also adds and removes from rooms based on arguments."""
    global SIDDataTracker, roomUserTracker
    if not (SIDDataTracker[sid][0] == "unset"):
        await sessionID.leave_room(sid, SIDDataTracker[sid][0])
        roomUserTracker[SIDDataTracker[sid][0]].remove(SIDDataTracker[sid][1])
        if not roomUserTracker[SIDDataTracker[sid][0]]:
            del roomUserTracker[SIDDataTracker[sid][0]]

    SIDDataTracker.update({sid: [data["room"], data["user"]]})

    if not (data["room"] == "unset"):
        if (data["room"] in roomUserTracker):
            roomUserTracker[data["room"]].append(data["user"])
        else:
            roomUserTracker[data["room"]] = [data["user"]]

        await sessionID.enter_room(sid, data["room"])

#pretty simple, checks if the username is a duplicate; adds a "+" after their username if not
@sessionID.event
async def validate(sid, data):
    if data["user"] in roomUserTracker.get(data["room"], []):
        return await validate(sid, {"room": data["room"], "user": data["user"] + "(+) "})
    else:
        return data["user"]
