const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

app.use(express.static('public')); // Serve static files from the "public" directory

// Handle new connections
io.on('connection', (socket) => {
    console.log('a user connected');
    
    // Add the user to the list
    users.push(socket.id);

    // Randomly match users
    if (users.length > 1) {
        const user1 = users.pop();
        const user2 = users.pop();
        
        // Notify both users about the match
        io.to(user1).emit('match', user2);
        io.to(user2).emit('match', user1);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected');
        users = users.filter(user => user !== socket.id);
    });

    // Signaling: send offer, answer, and ICE candidates
    socket.on('offer', (data) => {
        io.to(data.target).emit('offer', data.offer);
    });
    
    socket.on('answer', (data) => {
        io.to(data.target).emit('answer', data.answer);
    });
    
    socket.on('ice-candidate', (data) => {
        io.to(data.target).emit('ice-candidate', data.candidate);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});


const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302" // Google STUN server
        },
        {
            urls: "turn:your-turn-server-url.com",
            username: "your-username",
            credential: "your-credential"
        }
    ]
};



