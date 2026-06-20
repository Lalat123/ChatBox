const Message = require('../models/Message');
const { DMMessage } = require('../models/DM');

module.exports = (io, socket) => {
  socket.on('message:send', async ({ channelId, content, isDM }) => {
    try {
      if (isDM) {
        const message = await DMMessage.create({
          dm_channel_id: channelId,
          user_id: socket.user.userId,
          content
        });
        io.to(`dm:${channelId}`).emit('message:new', { ...message, isDM: true });
      } else {
        const message = await Message.create({
          channel_id: channelId,
          user_id: socket.user.userId,
          content
        });
        io.to(`channel:${channelId}`).emit('message:new', { ...message, isDM: false });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('message:update', ({ channelId, message, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    io.to(room).emit('message:updated', { ...message, isDM });
  });

  socket.on('message:delete', ({ channelId, messageId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    io.to(room).emit('message:deleted', { messageId, isDM });
  });

  socket.on('message:react', ({ channelId, reactions, messageId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    io.to(room).emit('message:reactions_updated', { messageId, reactions, isDM });
  });

  socket.on('typing:start', ({ channelId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    socket.to(room).emit('typing:update', {
      userId: socket.user.userId,
      username: socket.user.username,
      isTyping: true,
      channelId,
      isDM
    });
  });

  socket.on('typing:stop', ({ channelId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    socket.to(room).emit('typing:update', {
      userId: socket.user.userId,
      username: socket.user.username,
      isTyping: false,
      channelId,
      isDM
    });
  });
};
