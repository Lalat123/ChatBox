const db = require('../config/database');

class Reaction {
  static async add(message_id, user_id, emoji) {
    await db.query(`
      INSERT INTO message_reactions (message_id, user_id, emoji) 
      VALUES ($1, $2, $3) 
      ON CONFLICT DO NOTHING
    `, [message_id, user_id, emoji]);
    return this.getByMessage(message_id);
  }

  static async remove(message_id, user_id, emoji) {
    await db.query(`
      DELETE FROM message_reactions 
      WHERE message_id = $1 AND user_id = $2 AND emoji = $3
    `, [message_id, user_id, emoji]);
    return this.getByMessage(message_id);
  }

  static async getByMessage(message_id) {
    const res = await db.query(`
      SELECT emoji, STRING_AGG(user_id::text, ',') as user_ids 
      FROM message_reactions 
      WHERE message_id = $1 
      GROUP BY emoji
    `, [message_id]);
    
    return res.rows.map(r => ({
      emoji: r.emoji,
      users: r.user_ids ? r.user_ids.split(',').map(Number) : []
    }));
  }
}

module.exports = Reaction;
