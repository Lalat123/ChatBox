import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  servers: [],
  activeServerId: null,
  
  channels: [],
  activeChannelId: null,
  
  dms: [],
  activeDmId: null,
  
  messages: [],
  onlineUsers: [],
  typingUsers: [],

  view: 'server', // 'server' or 'dm'

  setView: (view) => set({ view, activeServerId: view === 'dm' ? null : get().activeServerId }),

  fetchServers: async () => {
    const res = await api.get('/servers');
    set({ servers: res.data });
    if (res.data.length > 0 && get().view === 'server') {
      get().setActiveServer(res.data[0].id);
    }
  },

  fetchDMs: async () => {
    const res = await api.get('/dms');
    set({ dms: res.data });
  },

  createServer: async (name) => {
    const res = await api.post('/servers', { name });
    set((state) => ({ servers: [...state.servers, res.data] }));
    get().setActiveServer(res.data.id);
  },

  setActiveServer: async (serverId) => {
    set({ activeServerId: serverId, channels: [], activeChannelId: null, messages: [], view: 'server', activeDmId: null });
    const res = await api.get(`/servers/${serverId}/channels`);
    set({ channels: res.data });
    if (res.data.length > 0) {
      get().setActiveChannel(res.data[0].id);
    }
  },

  createChannel: async (serverId, name) => {
    const res = await api.post(`/servers/${serverId}/channels`, { name });
    if (get().activeServerId === serverId) {
      set((state) => ({ channels: [...state.channels, res.data] }));
    }
  },

  deleteChannel: async (channelId) => {
    await api.delete(`/channels/${channelId}`);
    set((state) => {
      const newChannels = state.channels.filter(c => c.id !== channelId);
      const newActiveChannelId = state.activeChannelId === channelId 
        ? (newChannels.length > 0 ? newChannels[0].id : null) 
        : state.activeChannelId;
        
      if (state.activeChannelId === channelId && newActiveChannelId) {
        get().setActiveChannel(newActiveChannelId);
      } else if (state.activeChannelId === channelId && !newActiveChannelId) {
        set({ activeChannelId: null, messages: [] });
      }
      return { channels: newChannels };
    });
  },

  editChannel: async (channelId, name) => {
    const res = await api.put(`/channels/${channelId}`, { name });
    set((state) => ({
      channels: state.channels.map(c => c.id === channelId ? res.data : c)
    }));
  },

  setActiveChannel: async (channelId) => {
    set({ activeChannelId: channelId, activeDmId: null, view: 'server' });
    const res = await api.get(`/channels/${channelId}/messages`);
    set({ messages: res.data });
  },

  startDM: async (userId) => {
    const res = await api.post(`/dms/${userId}`);
    const dm = res.data;
    set((state) => {
      if (!state.dms.find(d => d.id === dm.id)) {
        return { dms: [dm, ...state.dms] };
      }
      return state;
    });
    get().setActiveDM(dm.id);
  },

  setActiveDM: async (dmId) => {
    set({ activeDmId: dmId, activeChannelId: null, activeServerId: null, view: 'dm' });
    const res = await api.get(`/dms/${dmId}/messages`);
    set({ messages: res.data });
  },

  uploadFile: async (channelId, file, content = '', isDM = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (content) formData.append('content', content);
    
    await api.post(`/${isDM ? 'dms' : 'channels'}/${channelId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  addMessage: (message) => {
    // Only add if it matches our active view/channel
    const state = get();
    if ((message.isDM && message.dm_channel_id === state.activeDmId) || 
        (!message.isDM && message.channel_id === state.activeChannelId)) {
      set((state) => ({ messages: [...state.messages, message] }));
    }
  },

  updateMessage: (updatedMsg) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)
    }));
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(m => m.id !== messageId)
    }));
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  setTypingIndicator: (data) => {
    set((state) => {
      // Filter out this user if they are already in the array
      let newTyping = state.typingUsers.filter(u => u.userId !== data.userId);
      if (data.isTyping && 
         ((data.isDM && data.channelId === state.activeDmId) || 
         (!data.isDM && data.channelId === state.activeChannelId))) {
        newTyping.push(data);
      }
      return { typingUsers: newTyping };
    });
  }
}));

export default useChatStore;
