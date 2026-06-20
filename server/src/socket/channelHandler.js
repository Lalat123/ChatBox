module.exports = (io, socket) => {
  socket.on('channel:join', ({ channelId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    socket.join(room);
  });

  socket.on('channel:leave', ({ channelId, isDM }) => {
    const room = isDM ? `dm:${channelId}` : `channel:${channelId}`;
    socket.leave(room);
  });
};
