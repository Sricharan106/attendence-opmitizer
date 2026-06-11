import { Pool, type PoolConfig } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString: string = process.env.POSTGRESQL_URI ?? "";

const pgConfig: PoolConfig = {
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: false,
};

export const pool = new Pool(pgConfig);

export const connectDB = async (): Promise<void> => {
  try {
    // A quick query to verify the connection works
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL connected");
  } catch (error) {
    console.error(
      "❌ PostgreSQL connection failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

export default connectDB;
