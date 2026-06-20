const { socketAuthMiddleware } = require('../middleware/auth');
const chatHandler = require('./chatHandler');
const channelHandler = require('./channelHandler');

// Map to store online users and their statuses
const onlineUsers = new Map();

module.exports = (io) => {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    onlineUsers.set(socket.user.userId, { 
      id: socket.user.userId,
      username: socket.user.username, 
      status: 'online' 
    });
    io.emit('presence:update', Array.from(onlineUsers.values()));

    // Channels
    channelHandler(io, socket);

    // Chat
    chatHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      onlineUsers.delete(socket.user.userId);
      io.emit('presence:update', Array.from(onlineUsers.values()));
    });
  });
};
