const db = require('../config/database');

class User {
  static async create({ username, email, password_hash, avatar_color }) {
    const res = await db.query(`
      INSERT INTO users (username, email, password_hash, avatar_color)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [username, email, password_hash, avatar_color]);
    return res.rows[0].id;
  }

  static async findByEmail(email) {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  }

  static async findById(id) {
    const res = await db.query('SELECT id, username, email, avatar_color, real_avatar_url, bio, status, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0];
  }

  static async updateStatus(id, status) {
    await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
  }
}

module.exports = User;
