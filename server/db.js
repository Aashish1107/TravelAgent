const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require("ws");
const schema = require("./schema");


neonConfig.webSocketConstructor = ws;

if (!process.env.DB_PASSWORD || !process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME) {
  throw new Error(
    "DATABASE must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});
const db = drizzle({ client: pool, schema });

module.exports = { pool, db };