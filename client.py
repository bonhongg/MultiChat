import socketio
import asyncio

# Client -- no FastAPI usage here

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# I have to port this to JS. Work with the server for now.
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


sio = socketio.AsyncClient()

user = ""
roomID = "unset"
    
async def connectToRoom(RID, UID):
    """Connect to room ID with given username. RID and UID should be strings.
       Will return True if successful and False if unsuccessful.
    
       The RID cannot be set as \"unset\", but is flexible otherwise."""
    global roomID, user
    if (not (roomID == "unset") or RID == "unset"):
        return False
    
    # Check for username validity - if username taken, server adds "(+)" to username
    try:
        user = await sio.call("validate", {"room": RID, "user": UID})
    except TimeoutError:
        return False

    roomID = RID
    # updateInfo is sent so the server saves the roomID with the SID of the client
    # The server will add that SID and username to the room
    await sio.emit("updateInfo", {"room": roomID, "user": user})
    await sio.emit("message", {"text": f"{user} has joined the room"})
    return True;

async def leaveRoom():
    """Leaves the room the client is in."""
    global roomID, user
    await sio.emit("message", {"text": f"{user} has left the room"})
    await sio.emit("updateInfo", {"room": "unset", "user": ""})
    roomID = "unset"
    user = ""
    
async def sendToRoom(message):
    """Send message to room. Should be called whenever client submits a message.
    
       Already formatted to display as Username: Message"""
    if (roomID == "unset"):
        raise Exception("User is not in a room")
    await sio.emit("message", {"text": f"{user}: {message}"})
    
@sio.event
async def message(data):
    print(data)
    
async def main():
    await sio.connect("http://localhost:8000")
    await sio.wait()

asyncio.run(main())