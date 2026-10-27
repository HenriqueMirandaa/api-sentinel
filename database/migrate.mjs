import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const files = (await readdir(new URL("./migrations/", import.meta.url))).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  await pool.query(await readFile(new URL(`./migrations/${file}`, import.meta.url), "utf8"));
  console.log(`Applied ${file}`);
}
await pool.end();
