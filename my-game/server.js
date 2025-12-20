const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let itPlayerId = null;

io.on('connection', (socket) => {
    // Add new player with a random color
    players[socket.id] = {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        id: socket.id,
        color: Math.random() * 0xffffff
    };

    // First person to join is "It"
    if (!itPlayerId) itPlayerId = socket.id;

    // Send everyone the updated state
    io.emit('updatePlayers', { players, itPlayerId });

    socket.on('move', (moveData) => {
        if (players[socket.id]) {
            players[socket.id].x = moveData.x;
            players[socket.id].y = moveData.y;

            // Simple Tag Logic: If "It" touches someone, they become "It"
            if (socket.id === itPlayerId) {
                for (let id in players) {
                    if (id !== socket.id) {
                        let dist = Math.hypot(players[id].x - moveData.x, players[id].y - moveData.y);
                        if (dist < 30) {
                            itPlayerId = id; // New player is it!
                            break;
                        }
                    }
                }
            }
            io.emit('updatePlayers', { players, itPlayerId });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        if (itPlayerId === socket.id) itPlayerId = Object.keys(players)[0] || null;
        io.emit('updatePlayers', { players, itPlayerId });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server on port ${PORT}`));