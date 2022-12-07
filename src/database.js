import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

export const connection = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});