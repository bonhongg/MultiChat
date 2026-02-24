import socketio
from fastapi import FastAPI

app = FastAPI()
@app.get("/")
#root directory test
async def root():
    return {"message": "Hello World"}

sessionID = socketio.AsyncServer(async_mode = 'asgi', cors_allowed_origins='*')

socket_app = socketio.ASGIApp(sessionID, app)

@sessionID.event
async def connect(sid, environ):
    print(f"user connected: {sessionID}")

@sessionID.event
async def disconnect(sid):
    print(f"user disconnected: {sessionID}")

@sessionID.event
async def message(sid, data):
    print(f"message received {sessionID}: {data}")

    #sends message back to the person who sent it, to=server sends message to everyone
    await sessionID.emit('reply', f"Echo: {data}", to=sessionID)