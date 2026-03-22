import socketio
from fastapi import FastAPI

# I'll be honest, no idea if this next import is necessary, but it seems useful
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# Dict which stores Socket ID as key and [room, username] as value
SIDDataTracker = {}
# Dict which stores existing usernames in a room
roomUserTracker = {}

sessionID = socketio.AsyncServer(async_mode = 'asgi', cors_allowed_origins='*')

socket_app = socketio.ASGIApp(sessionID, app)



@sessionID.event
async def connect(sid, environ):
    """Normal connect, but also adds info to tracker array."""
    global SIDDataTracker
    SIDDataTracker[sid] = ["unset", ""]

@sessionID.event
async def disconnect(sid):
    """Normal disconnect, but also removes info from tracker arrays."""
    global SIDDataTracker, roomUserTracker
    if not (SIDDataTracker[sid][0] == "unset"):
        user = SIDDataTracker[sid][1]
        roomUserTracker[SIDDataTracker[sid][0]].remove(user)
    del SIDDataTracker[sid]
    

@sessionID.event
async def message(sid, data):
    """Sends message to all in client's room. Message should be recieved from here - no polling necessary."""
    global SIDDataTracker
    if (SIDDataTracker[sid][0] == "unset"):
        raise Exception("User is not in a room")
    await sessionID.emit("message", data["text"], to=SIDDataTracker[sid][0])
    
@sessionID.event
async def updateInfo(sid, data):
    """Updates usernames and room IDs on the tracker. Also adds and removes from rooms based on arguments."""
    global SIDDataTracker, roomUserTracker
    if not (SIDDataTracker[sid][0] == "unset"):
        await sessionID.leave_room(sid, SIDDataTracker[sid][0])
        roomUserTracker[SIDDataTracker[sid][0]].remove(SIDDataTracker[sid][1])
        
    SIDDataTracker.update({sid: [data["room"], data["user"]]})
    
    if not (data["room"] == "unset"):
        if (data["room"] in roomUserTracker):    
            roomUserTracker[data["room"]].append(data["user"])
        else:
            roomUserTracker[data["room"]] = [data["user"]]
            
        await sessionID.enter_room(sid, data["room"])