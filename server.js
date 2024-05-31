const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Statik dosyaları sunmak için public klasörünü kullan
app.use(express.static('public'));

// Yeni bir bağlantı olduğunda çalışacak olaylar
io.on('connection', socket => {
    console.log('New user connected');

    // Teklifler, yanıtlar ve ICE adayları için olayları dinle ve yayınla
    socket.on('offer', offer => {
        console.log('Offer received:', offer);
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', answer => {
        console.log('Answer received:', answer);
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', candidate => {
        console.log('Candidate received:', candidate);
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Sunucuyu belirli bir portta çalıştır
server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});
