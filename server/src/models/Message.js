const db = require('../config/database');
const Reaction = require('./Reaction');

class Message {
  static async create({ channel_id, user_id, content, attachment_url = null, attachment_type = null }) {
    const res = await db.query(`
      INSERT INTO messages (channel_id, user_id, content, attachment_url, attachment_type) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [channel_id, user_id, content || '', attachment_url, attachment_type]);
    
    return this.findById(res.rows[0].id);
  }

  static async findById(id) {
    const res = await db.query(`
      SELECT m.*, u.username, u.avatar_color, u.real_avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [id]);
    
    const message = res.rows[0];
    if (message) {
      message.reactions = await Reaction.getByMessage(message.id);
    }
    return message;
  }

  static async getByChannel(channel_id, cursor = 0, limit = 50) {
    let res;
    if (cursor) {
      res = await db.query(`
        SELECT m.*, u.username, u.avatar_color, u.real_avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.channel_id = $1 AND m.id < $2
        ORDER BY m.id DESC LIMIT $3
      `, [channel_id, cursor, limit]);
    } else {
      res = await db.query(`
        SELECT m.*, u.username, u.avatar_color, u.real_avatar_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.channel_id = $1
        ORDER BY m.id DESC LIMIT $2
      `, [channel_id, limit]);
    }
    
    const messages = res.rows.reverse();
      
    // Attach reactions
    await Promise.all(messages.map(async (m) => {
      m.reactions = await Reaction.getByMessage(m.id);
    }));
    
    return messages;
  }

  static async delete(id) {
    await db.query('DELETE FROM messages WHERE id = $1', [id]);
  }
}

module.exports = Message;
