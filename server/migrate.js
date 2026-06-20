const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const sqlite = new Database(path.join(__dirname, 'database/nexuschat.db'));
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000
});

async function migrate() {
  try {
    console.log('Starting migration from SQLite to PostgreSQL...');

    // 0. Drop and Recreate tables with perfect schema
    console.log('Recreating schema...');
    
    await pg.query('DROP TABLE IF EXISTS message_reactions, messages, channels, server_members, servers, dm_messages, dm_channels, users CASCADE;');

    await pg.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_color VARCHAR(255) DEFAULT '#6C63FF',
        real_avatar_url TEXT,
        bio TEXT DEFAULT '',
        status VARCHAR(255) DEFAULT 'offline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pg.query(`
      CREATE TABLE servers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        icon_color VARCHAR(255) DEFAULT '#6C63FF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pg.query(`
      CREATE TABLE server_members (
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(255) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (server_id, user_id)
      )
    `);

    await pg.query(`
      CREATE TABLE channels (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        type VARCHAR(255) DEFAULT 'text',
        category VARCHAR(255) DEFAULT 'General',
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pg.query(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type VARCHAR(255),
        edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pg.query(`
      CREATE TABLE message_reactions (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (message_id, user_id, emoji)
      )
    `);

    await pg.query(`
      CREATE TABLE dm_channels (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user1_id, user2_id)
      )
    `);

    await pg.query(`
      CREATE TABLE dm_messages (
        id SERIAL PRIMARY KEY,
        dm_channel_id INTEGER REFERENCES dm_channels(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type VARCHAR(255),
        edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Users
    console.log('Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await pg.query(`
        INSERT INTO users (id, username, email, password_hash, avatar_color, real_avatar_url, bio, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [u.id, u.username, u.email, u.password_hash, u.avatar_color, u.real_avatar_url, u.bio, u.status, u.created_at]);
    }
    await pg.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");

    // 2. Servers
    console.log('Migrating servers...');
    const servers = sqlite.prepare('SELECT * FROM servers').all();
    for (const s of servers) {
      await pg.query(`
        INSERT INTO servers (id, name, owner_id, icon_color, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.name, s.owner_id, s.icon_color, s.created_at]);
    }
    await pg.query("SELECT setval('servers_id_seq', (SELECT MAX(id) FROM servers));");

    // 3. Server Members
    console.log('Migrating server members...');
    const serverMembers = sqlite.prepare('SELECT * FROM server_members').all();
    for (const sm of serverMembers) {
      await pg.query(`
        INSERT INTO server_members (server_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (server_id, user_id) DO NOTHING
      `, [sm.server_id, sm.user_id, sm.role, sm.joined_at]);
    }

    // 4. Channels
    console.log('Migrating channels...');
    const channels = sqlite.prepare('SELECT * FROM channels').all();
    for (const c of channels) {
      await pg.query(`
        INSERT INTO channels (id, server_id, name, description, type, category, position, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.server_id, c.name, c.description, c.type, c.category, c.position, c.created_at]);
    }
    await pg.query("SELECT setval('channels_id_seq', (SELECT MAX(id) FROM channels));");

    // 5. Messages
    console.log('Migrating messages...');
    const messages = sqlite.prepare('SELECT * FROM messages').all();
    for (const m of messages) {
      await pg.query(`
        INSERT INTO messages (id, channel_id, user_id, content, attachment_url, attachment_type, edited, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [m.id, m.channel_id, m.user_id, m.content, m.attachment_url, m.attachment_type, m.edited === 1, m.created_at, m.updated_at]);
    }
    await pg.query("SELECT setval('messages_id_seq', (SELECT MAX(id) FROM messages));");

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate();
