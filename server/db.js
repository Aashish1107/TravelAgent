const { cidr } = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/postgres-js');
const schema = require("./schema").default || require("./schema");
const {Client} = require('pg');

if (!process.env.DB_PASSWORD || !process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME) {
  throw new Error(
    "DATABASE must be set. Did you forget to provision a database?",
  );
}

const client = new Client({ connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`});

const conn= client.connect()
  .then(() => {console.log("Connected to the database");
    //console.log(client);
  })
  .catch ((err) =>{
    console.error("Database connection error:", err);
    process.exit(1);
  });
const db = drizzle(process.env.DATABASE_URL);

module.exports = { client, db };