import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../stores/useAuthStore';
import useChatStore from '../stores/useChatStore';
import { useSocket } from '../hooks/useSocket';
import { format } from 'date-fns';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Paperclip, Smile, MoreVertical, Edit2, Trash2, Home, MessageSquare } from 'lucide-react';
import api from '../services/api';

const ChatLayout = () => {
  const { user, logout, fetchMe } = useAuthStore();
  const { 
    servers, activeServerId, channels, activeChannelId, messages, onlineUsers, typingUsers,
    dms, activeDmId, view, setView, fetchDMs, startDM, setActiveDM,
    fetchServers, createServer, createChannel, deleteChannel, editChannel, setActiveServer, setActiveChannel, uploadFile
  } = useChatStore();
  
  const { sendMessage, sendTyping, editMessageSocket, deleteMessageSocket, sendReactionSocket } = useSocket();
  
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null); // { msgId, x, y }
  const [contextMenu, setContextMenu] = useState(null);
  const [msgContextMenu, setMsgContextMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeProfile, setActiveProfile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileFileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchServers();
    fetchDMs();
  }, []);

  if (!user) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'white' }}>Loading...</div>;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setMsgContextMenu(null);
      setShowEmojiPicker(false);
      setShowReactionPicker(null);
      if (activeProfile && !activeProfile.isEditing) setActiveProfile(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeProfile]);

  const handleInputChange = (e) => {
    setContent(e.target.value);
    
    // Typing indicator logic
    const activeId = view === 'dm' ? activeDmId : activeChannelId;
    if (activeId) {
      sendTyping(activeId, true, view === 'dm');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeId, false, view === 'dm');
      }, 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const activeId = view === 'dm' ? activeDmId : activeChannelId;
    if (content.trim() && activeId) {
      sendMessage(activeId, content, view === 'dm');
      setContent('');
      sendTyping(activeId, false, view === 'dm');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Channel Context Menu
  const handleContextMenu = (e, channel) => {
    e.preventDefault();
    if (channel.name === 'general') return;
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, channel });
  };

  // Message Context Menu
  const handleMsgContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    setMsgContextMenu({ mouseX: e.clientX, mouseY: e.clientY, msg });
  };

  // Message Actions
  const handleEditMessage = async (e, msg) => {
    e.preventDefault();
    if (editContent.trim() && editContent !== msg.content) {
      const res = await api.put(`/messages/${msg.id}`, { content: editContent });
      const activeId = view === 'dm' ? activeDmId : activeChannelId;
      editMessageSocket(activeId, res.data, view === 'dm');
    }
    setEditingMessageId(null);
  };

  const handleDeleteMessage = async (msgId) => {
    if (confirm('Delete this message?')) {
      await api.delete(`/messages/${msgId}`);
      const activeId = view === 'dm' ? activeDmId : activeChannelId;
      deleteMessageSocket(activeId, msgId, view === 'dm');
    }
  };

  const handleReaction = async (emojiData, msgId) => {
    const res = await api.post(`/messages/${msgId}/reactions`, { emoji: emojiData.emoji });
    const activeId = view === 'dm' ? activeDmId : activeChannelId;
    sendReactionSocket(activeId, msgId, res.data, view === 'dm');
    setShowReactionPicker(null);
  };

  // Profile Upload
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    await api.put('/users/me/profile', formData);
    fetchMe();
  };

  const handleOpenProfile = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/users/${userId}`);
      const profileData = res.data;
      setActiveProfile({ ...profileData, isSelf: userId === user.id, isEditing: false });
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const handleUpdateBio = async (bio) => {
    await api.put('/users/me/profile', { bio });
    await fetchMe();
    setActiveProfile(null);
  };

  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = channels.find(c => c.id === activeChannelId);
  const activeDMObj = dms.find(d => d.id === activeDmId);

  return (
    <div className="app-layout" onContextMenu={(e) => { if(contextMenu) e.preventDefault(); }}>
      {/* 1. Server Sidebar */}
      <div className="server-sidebar">
        <div 
          className={`server-icon ${view === 'dm' ? 'active' : ''}`}
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          onClick={() => setView('dm')}
          title="Direct Messages"
        >
          <Home size={24} />
        </div>
        <div style={{ width: '32px', height: '2px', backgroundColor: 'var(--border)', margin: '8px 0', borderRadius: '1px' }}></div>
        
        {servers.map(server => (
          <div 
            key={server.id}
            className={`server-icon ${activeServerId === server.id ? 'active' : ''}`}
            style={{ backgroundColor: server.icon_color || '#6C63FF', color: 'white' }}
            onClick={() => setActiveServer(server.id)}
            title={server.name}
          >
            {server.name.charAt(0).toUpperCase()}
          </div>
        ))}
        <div style={{ flex: 1 }}></div>
        <div className="server-icon add-btn" title="Add Server" onClick={() => {
          const name = prompt('Enter new server name:');
          if (name) createServer(name);
        }}>+</div>
      </div>

      {/* 2. Channel/DM Sidebar */}
      <div className="channel-sidebar">
        <div className="header glass" style={{ borderBottom: '1px solid var(--border)' }}>
          {view === 'server' ? (activeServer ? activeServer.name : 'Nexus Community') : 'Direct Messages'}
        </div>
        
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {view === 'server' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>Text Channels</div>
                {activeServerId && <div title="Create Channel" onClick={() => {
                  const name = prompt('Enter new channel name (no spaces):');
                  if (name) createChannel(activeServerId, name.toLowerCase().replace(/\s+/g, '-'));
                }} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1' }}>+</div>}
              </div>
              {channels.map(channel => (
                <div 
                  key={channel.id}
                  onContextMenu={(e) => handleContextMenu(e, channel)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', marginBottom: '2px',
                    backgroundColor: activeChannelId === channel.id ? 'var(--bg-tertiary)' : 'transparent',
                    borderRadius: '4px', cursor: 'pointer', 
                    color: activeChannelId === channel.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setActiveChannel(channel.id)}
                >
                  <div><span style={{ color: 'var(--text-muted)' }}>#</span> {channel.name}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              {dms.map(dm => (
                <div 
                  key={dm.id}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', marginBottom: '2px',
                    backgroundColor: activeDmId === dm.id ? 'var(--bg-tertiary)' : 'transparent',
                    borderRadius: '4px', cursor: 'pointer', 
                    color: activeDmId === dm.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setActiveDM(dm.id)}
                >
                  <div style={{ position: 'relative' }}>
                    {dm.real_avatar_url ? (
                      <img src={`http://localhost:3000${dm.real_avatar_url}`} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                    ) : (
                      <div className="message-avatar" style={{ backgroundColor: dm.avatar_color, width: '32px', height: '32px' }}>
                        {dm.other_username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dm.status === 'online' ? 'var(--success)' : 'var(--text-muted)', border: '2px solid var(--bg-secondary)' }}></div>
                  </div>
                  <div>{dm.other_username}</div>
                </div>
              ))}
              {dms.length === 0 && <div className="text-muted" style={{ fontSize: '0.85rem' }}>No direct messages yet. Click a user to start chatting!</div>}
            </>
          )}
        </div>

        {/* Current User Panel */}
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={(e) => handleOpenProfile(e, user.id)}>
          {user.real_avatar_url ? (
             <img src={`http://localhost:3000${user.real_avatar_url}`} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
          ) : (
             <div className="message-avatar" style={{ backgroundColor: user.avatar_color, width: '32px', height: '32px' }}>
               {user.username.charAt(0).toUpperCase()}
             </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); logout(); }}>Logout</div>
          </div>
        </div>
      </div>

      {/* 3. Main Chat Area */}
      <div className="chat-area">
        <div className="header glass">
          <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>
            {view === 'server' ? '#' : '@'}
          </span> 
          {view === 'server' ? (activeChannel ? activeChannel.name : 'Select a channel') : (activeDMObj ? activeDMObj.other_username : 'Select a conversation')}
        </div>
        
        <div className="message-list">
          {messages.map(msg => (
            <div 
              className="message-item" 
              key={msg.id} 
              style={{ position: 'relative' }}
              onContextMenu={(e) => handleMsgContextMenu(e, msg)}
            >
              
              <div style={{ cursor: 'pointer' }} onClick={(e) => handleOpenProfile(e, msg.user_id)}>
                {msg.real_avatar_url ? (
                  <img src={`http://localhost:3000${msg.real_avatar_url}`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                ) : (
                  <div className="message-avatar" style={{ backgroundColor: msg.avatar_color }}>
                    {msg.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="message-content" style={{ width: '100%' }}>
                <div className="message-header">
                  <span className="message-author" style={{ cursor: 'pointer' }} onClick={(e) => handleOpenProfile(e, msg.user_id)}>{msg.username}</span>
                  <span className="message-time">
                    {format(new Date(msg.created_at), 'MMM d, p')}
                    {msg.edited ? <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(edited)</span> : null}
                  </span>
                </div>
                
                {editingMessageId === msg.id ? (
                  <form onSubmit={(e) => handleEditMessage(e, msg)} style={{ marginTop: '4px' }}>
                    <input type="text" value={editContent} onChange={e => setEditContent(e.target.value)} style={{ width: '100%', padding: '8px' }} autoFocus />
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>Escape to cancel, Enter to save</div>
                  </form>
                ) : (
                  <div className="message-body">{msg.content}</div>
                )}
                
                {msg.attachment_url && (
                  <div style={{ marginTop: '8px' }}>
                    {msg.attachment_type?.startsWith('image/') ? (
                      <img src={`http://localhost:3000${msg.attachment_url}`} alt="attachment" style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }} />
                    ) : (
                      <a href={`http://localhost:3000${msg.attachment_url}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--accent-secondary)', textDecoration: 'none' }}>
                        <Paperclip size={16} /> Download File
                      </a>
                    )}
                  </div>
                )}

                {/* Reactions Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {msg.reactions.map(r => (
                      <div key={r.emoji} style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => handleReaction({ emoji: r.emoji }, msg.id)}>
                        {r.emoji} <span style={{ marginLeft: '4px', color: 'var(--text-muted)' }}>{r.users.length}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div style={{ padding: '8px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form className="chat-input-wrapper" onSubmit={handleSend} style={{ position: 'relative' }}>
            <div style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }} onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={20} />
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const activeId = view === 'dm' ? activeDmId : activeChannelId;
              if (!activeId) return;
              await uploadFile(activeId, file, content, view === 'dm');
              setContent('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} />
            
            <input 
              type="text" 
              placeholder={`Message...`} 
              value={content}
              onChange={handleInputChange}
              disabled={view === 'server' ? !activeChannelId : !activeDmId}
              style={{ flex: 1 }}
            />
            
            <div style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }} onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}>
              <Smile size={20} />
            </div>

            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '16px', zIndex: 100 }} onClick={e => e.stopPropagation()}>
                <EmojiPicker onEmojiClick={(eData, e) => { e.stopPropagation(); setContent(prev => prev + eData.emoji); }} theme={Theme.DARK} lazyLoadEmojis={true} />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 4. Member Sidebar (Only in server view) */}
      {view === 'server' && (
        <div className="member-sidebar">
          <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '12px' }}>
            Online — {onlineUsers.length}
          </div>
          
          {onlineUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }} onClick={(e) => handleOpenProfile(e, u.id)}>
              <div style={{ position: 'relative' }}>
                <div className="message-avatar" style={{ backgroundColor: '#6C63FF', width: '32px', height: '32px' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', border: '2px solid var(--bg-secondary)' }}></div>
              </div>
              <span style={{ fontSize: '0.9rem', color: u.username === user.username ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {u.username} {u.username === user.username && '(You)'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu Popup */}
      {contextMenu !== null && (
        <div style={{ position: 'absolute', top: contextMenu.mouseY, left: contextMenu.mouseX, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '150px' }}>
          <div style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }} onClick={() => {
            const newName = prompt('Enter new channel name:', contextMenu.channel.name);
            if (newName && newName !== contextMenu.channel.name) editChannel(contextMenu.channel.id, newName.toLowerCase().replace(/\s+/g, '-'));
            setContextMenu(null);
          }}>✏️ Edit Channel</div>
          <div style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger)' }} onClick={() => {
            if (confirm(`Are you sure you want to delete #${contextMenu.channel.name}?`)) deleteChannel(contextMenu.channel.id);
            setContextMenu(null);
          }}>🗑️ Delete Channel</div>
        </div>
      )}

      {/* Message Context Menu Popup */}
      {msgContextMenu !== null && (
        <div style={{ position: 'fixed', top: msgContextMenu.mouseY, left: msgContextMenu.mouseX, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 0', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '150px' }}>
          <div style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => {
            e.stopPropagation();
            // Show picker fixed relative to the click
            const isNearBottom = msgContextMenu.mouseY > window.innerHeight - 400;
            setShowReactionPicker({ 
              msgId: msgContextMenu.msg.id, 
              x: msgContextMenu.mouseX, 
              y: isNearBottom ? window.innerHeight - 450 : msgContextMenu.mouseY 
            });
            setMsgContextMenu(null);
          }}>
            <Smile size={16} /> React
          </div>
          {msgContextMenu.msg.user_id === user.id && (
            <>
              <div style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                setEditingMessageId(msgContextMenu.msg.id); 
                setEditContent(msgContextMenu.msg.content);
                setMsgContextMenu(null);
              }}>
                <Edit2 size={16} /> Edit Message
              </div>
              <div style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                handleDeleteMessage(msgContextMenu.msg.id);
                setMsgContextMenu(null);
              }}>
                <Trash2 size={16} /> Delete Message
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Reaction Picker */}
      {showReactionPicker !== null && (
        <div style={{ position: 'fixed', top: showReactionPicker.y, left: showReactionPicker.x, zIndex: 1100 }} onClick={e => e.stopPropagation()}>
          <EmojiPicker onEmojiClick={(eData) => handleReaction(eData, showReactionPicker.msgId)} theme={Theme.DARK} />
        </div>
      )}

      {/* Profile Modal */}
      {activeProfile && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => activeProfile.isEditing ? null : setActiveProfile(null)}>
          <div className="glass" style={{ width: '400px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: '100px', backgroundColor: activeProfile.avatar_color || '#6C63FF' }}></div>
            <div style={{ padding: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-40px', left: '20px', border: '6px solid var(--bg-primary)', borderRadius: '50%', backgroundColor: activeProfile.avatar_color || '#6C63FF' }}>
                {activeProfile.real_avatar_url ? (
                  <img src={`http://localhost:3000${activeProfile.real_avatar_url}`} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                ) : (
                  <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold' }}>
                    {activeProfile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {activeProfile.isSelf && activeProfile.isEditing && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--accent-primary)', padding: '4px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => profileFileInputRef.current?.click()}>
                    <Edit2 size={14} color="white" />
                  </div>
                )}
                <input type="file" ref={profileFileInputRef} style={{ display: 'none' }} onChange={handleProfileUpload} />
              </div>
              
              <div style={{ marginTop: '50px' }}>
                <h2 style={{ margin: '0 0 16px 0' }}>{activeProfile.username}</h2>
                
                {activeProfile.isEditing ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateBio(e.target.bio.value); }}>
                    <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>About Me</div>
                    <textarea name="bio" defaultValue={user.bio} style={{ width: '100%', height: '80px', padding: '8px', backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', marginBottom: '16px', resize: 'none' }} placeholder="Write something about yourself..." autoFocus />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setActiveProfile(null)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" style={{ padding: '8px 16px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>About Me</div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {activeProfile.bio || (activeProfile.isSelf ? "You haven't written a bio yet." : "This user hasn't written a bio.")}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!activeProfile.isSelf && (
                        <button style={{ flex: 1, padding: '10px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { startDM(activeProfile.id); setActiveProfile(null); }}>
                          <MessageSquare size={16} /> Send Message
                        </button>
                      )}
                      {activeProfile.isSelf && (
                        <button style={{ flex: 1, padding: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setActiveProfile({ ...activeProfile, isEditing: true })}>
                          <Edit2 size={16} /> Edit Profile
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
