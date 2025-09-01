import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
});


export async function getUserById(id) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function addUser(id, username) {
  const { rows } = await pool.query(
    `
    INSERT INTO users (id, user_name)
    VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET user_name = EXCLUDED.user_name
    RETURNING *
    `,
    [id, username]
  );
  return rows[0];
}

export async function setUserData(id, data) {
  const { rows } = await pool.query(
    `
    UPDATE users 
    SET data = COALESCE(data, '{}'::jsonb) || $1::jsonb
    WHERE id = $2
    RETURNING *
    `,
    [JSON.stringify(data), id]
  );
  return rows[0];
}

export async function updateUsername(id, username) {
  const { rows } = await pool.query(
    `
    UPDATE users SET user_name = $1
    WHERE id = $2
    `,
    [username, id]
  );
  return rows[0];
}

export async function setUserLoginFullName(id, login, fullName) {
  const { rows } = await pool.query(
    `
    UPDATE users SET login = $1, full_name = $2
    WHERE id = $3
    `,
    [login, fullName, id]
  );
  return rows[0];
}

export async function setUserMenuLevel(id, step) {
  const { rows } = await pool.query(
    `
    UPDATE users SET current_step = $1
    WHERE id = $2
    `,
    [step, id]
  );
  return rows[0];
}

export async function clearUserData(id) {
  const { rows } = await pool.query(
    `
    UPDATE users SET data = '{}'::jsonb
    WHERE id = $1
    `,
    [id]
  );
  return rows[0];
}

export async function createTaskRecord(chatId, data) {
  const { rows } = await pool.query(
    `
    INSERT INTO tasks (users_id, location, address, remark_type, cargo_id, photo_base64, comment)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [chatId, data.location, data.address, data.remarkType, data.cargoId, data.photoBase64, data.comment]
  );
  return rows[0];
}

export async function setTaskBitrixId(id, bitrixId) {
  const { rows } = await pool.query(
    `
    UPDATE tasks SET bitrix_id = $1
    WHERE id = $2
    `,
    [bitrixId, id]
  );
  return rows[0];
}

export async function getTaskByAddress(address) {
  const { rows } = await pool.query(
    `
    SELECT * FROM tasks WHERE address = $1
    `,
    [address]
  );
  return rows[0] ?? null;
}

export async function closeTask(id) {
  const { rows } = await pool.query(
    `
    UPDATE tasks SET active = FALSE
    WHERE id = $1
    `,
    [id]
  );
  return rows[0];
}