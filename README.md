# MultiChat

MultiChat is a browser-based real-time chat application built for COMP2100. Unlike basic turn-based client/server communication, MultiChat uses a server-backed messaging model so connected clients can exchange messages without unnecessary pauses. The application is hosted on a web server, so users do not need to download a separate app to use it.

Users enter a username and room ID before joining. If the requested username is already in use in the selected room, the system adjusts it by appending `(+)`. Once connected, users only receive messages sent within their room. When a user leaves the room or exits the page, the server removes that user from the room.

## Tech Stack
- Python
- FastAPI
- Socket.IO
- pathlib
- HTML
- CSS
- JavaScript
- Google Cloud

## Project Structure
- `main.py` - backend server logic using FastAPI and Socket.IO
- `client.py` - Python client/testing file
- `index.html` - main webpage
- `style.css` - UI styling
- `Client.js` - browser-side Socket.IO communication
- `app.js` - frontend UI logic

## Requirements
Before compiling and running MultiChat, make sure the following are installed:

### Software
- Python 3.10 or newer
- `pip` (Python package installer)

### Python Libraries
- `fastapi`
- `uvicorn`
- `python-socketio`
- `python-engineio`

## Installation
Install the required dependencies with:
```bash
pip install fastapi uvicorn python-socketio python-engineio
```

## Running the Application

Start the server from the terminal with:
```bash
uvicorn main:app --reload
```

Then open a browser and go to:
```text
http://127.0.0.1:8000
```

## Troubleshooting

### CSS or JavaScript is not loading
Make sure the static files are being served from the correct `static` directory.

### Socket.IO requests are not found
Make sure you are running the correct ASGI app with:

```bash
uvicorn main:app --reload
```

## Authors
- Brandon Qesja
- Bonhong Sreng
