const db = require('../config/database');

class Channel {
  static async create({ server_id, name, description, category }) {
    const res = await db.query(`
      INSERT INTO channels (server_id, name, description, category) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [server_id, name, description, category || 'General']);
    return res.rows[0].id;
  }

  static async findByServer(server_id) {
    const res = await db.query('SELECT * FROM channels WHERE server_id = $1 ORDER BY position ASC, id ASC', [server_id]);
    return res.rows;
  }

  static async findById(id) {
    const res = await db.query('SELECT * FROM channels WHERE id = $1', [id]);
    return res.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM channels WHERE id = $1', [id]);
  }

  static async update(id, { name }) {
    await db.query('UPDATE channels SET name = $1 WHERE id = $2', [name, id]);
    return this.findById(id);
  }
}

module.exports = Channel;
