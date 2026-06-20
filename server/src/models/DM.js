const db = require('../config/database');
const Reaction = require('./Reaction');

class DMChannel {
  static async findOrCreate(user1_id, user2_id) {
    const u1 = Math.min(user1_id, user2_id);
    const u2 = Math.max(user1_id, user2_id);
    
    let res = await db.query('SELECT id FROM dm_channels WHERE user1_id = $1 AND user2_id = $2', [u1, u2]);
    let channel = res.rows[0];
    
    if (!channel) {
      res = await db.query('INSERT INTO dm_channels (user1_id, user2_id) VALUES ($1, $2) RETURNING id', [u1, u2]);
      return res.rows[0].id;
    }
    return channel.id;
  }

  static async findByUser(user_id) {
    const res = await db.query(`
      SELECT d.id, 
        u.id as other_user_id, u.username as other_username, u.avatar_color, u.real_avatar_url, u.status 
      FROM dm_channels d
      JOIN users u ON (d.user1_id = u.id OR d.user2_id = u.id)
      WHERE (d.user1_id = $1 OR d.user2_id = $2) AND u.id != $3
    `, [user_id, user_id, user_id]);
    return res.rows;
  }
}

class DMMessage {
  static async create({ dm_channel_id, user_id, content, attachment_url, attachment_type }) {
    const res = await db.query(`
      INSERT INTO dm_messages (dm_channel_id, user_id, content, attachment_url, attachment_type) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [dm_channel_id, user_id, content || '', attachment_url, attachment_type]);
    
    return this.findById(res.rows[0].id);
  }

  static async findById(id) {
    const res = await db.query(`
      SELECT m.*, u.username, u.avatar_color, u.real_avatar_url
      FROM dm_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [id]);
    
    return res.rows[0];
  }

  static async getByChannel(dm_channel_id, limit = 50) {
    const res = await db.query(`
      SELECT m.*, u.username, u.avatar_color, u.real_avatar_url
      FROM dm_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.dm_channel_id = $1
      ORDER BY m.id DESC LIMIT $2
    `, [dm_channel_id, limit]);
    
    const messages = res.rows.reverse();
    
    await Promise.all(messages.map(async (m) => {
      m.reactions = await Reaction.getByMessage(m.id);
    }));
    
    return messages;
  }
}

module.exports = { DMChannel, DMMessage };
