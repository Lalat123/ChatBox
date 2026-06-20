import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/useAuthStore';
import useChatStore from '../stores/useChatStore';

export const useSocket = () => {
  const { token } = useAuthStore();
  const { 
    activeChannelId, activeDmId, addMessage, setOnlineUsers, 
    updateMessage, deleteMessage, setTypingIndicator, view 
  } = useChatStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = io('http://localhost:3000', {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to socket server');
      });

      socketRef.current.on('presence:update', (users) => {
        setOnlineUsers(users);
      });

      socketRef.current.on('message:new', (message) => {
        addMessage(message);
      });

      socketRef.current.on('message:updated', (message) => {
        updateMessage(message);
      });

      socketRef.current.on('message:deleted', ({ messageId }) => {
        deleteMessage(messageId);
      });

      socketRef.current.on('message:reactions_updated', ({ messageId, reactions }) => {
        updateMessage({ id: messageId, reactions }); // This works because zustand merges the objects
      });

      socketRef.current.on('typing:update', (data) => {
        setTypingIndicator(data);
      });

      socketRef.current.on('error', (err) => {
        console.error('Socket error:', err);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // Join/Leave Channel Logic (handles both server channels and DMs)
  useEffect(() => {
    const activeId = view === 'dm' ? activeDmId : activeChannelId;
    if (socketRef.current && activeId) {
      socketRef.current.emit('channel:join', { channelId: activeId, isDM: view === 'dm' });
      return () => {
        socketRef.current.emit('channel:leave', { channelId: activeId, isDM: view === 'dm' });
      };
    }
  }, [activeChannelId, activeDmId, view]);

  const sendMessage = (channelId, content, isDM = false) => {
    if (socketRef.current) {
      socketRef.current.emit('message:send', { channelId, content, isDM });
    }
  };

  const editMessageSocket = (channelId, message, isDM = false) => {
    if (socketRef.current) {
      socketRef.current.emit('message:update', { channelId, message, isDM });
    }
  };

  const deleteMessageSocket = (channelId, messageId, isDM = false) => {
    if (socketRef.current) {
      socketRef.current.emit('message:delete', { channelId, messageId, isDM });
    }
  };

  const sendReactionSocket = (channelId, messageId, reactions, isDM = false) => {
    if (socketRef.current) {
      socketRef.current.emit('message:react', { channelId, messageId, reactions, isDM });
    }
  };

  const sendTyping = (channelId, isTyping, isDM = false) => {
    if (socketRef.current) {
      socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', { channelId, isDM });
    }
  };

  return { sendMessage, sendTyping, editMessageSocket, deleteMessageSocket, sendReactionSocket };
};
