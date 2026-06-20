const db = require('../config/database');

class Server {
  static async create({ name, icon_color, owner_id }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const serverRes = await client.query('INSERT INTO servers (name, icon_color, owner_id) VALUES ($1, $2, $3) RETURNING id', [name, icon_color, owner_id]);
      const serverId = serverRes.rows[0].id;
      
      await client.query('INSERT INTO server_members (server_id, user_id, role) VALUES ($1, $2, $3)', [serverId, owner_id, 'owner']);
      
      await client.query('INSERT INTO channels (server_id, name) VALUES ($1, $2)', [serverId, 'general']);
      
      await client.query('COMMIT');
      return serverId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async findByUser(user_id) {
    const res = await db.query(`
      SELECT s.* FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
    `, [user_id]);
    return res.rows;
  }

  static async getMembers(server_id) {
    const res = await db.query(`
      SELECT u.id, u.username, u.avatar_color, u.status, sm.role, sm.joined_at
      FROM users u
      JOIN server_members sm ON u.id = sm.user_id
      WHERE sm.server_id = $1
    `, [server_id]);
    return res.rows;
  }

  static async addMember(server_id, user_id) {
    await db.query('INSERT INTO server_members (server_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [server_id, user_id, 'member']);
  }
}

module.exports = Server;
