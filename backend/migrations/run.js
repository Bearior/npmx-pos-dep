/**
 * Migration runner – reads and executes SQL files against Supabase.
 * Usage: node migrations/run.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config", "config.env") });

const { supabaseAdmin } = require("../config/supabase");

async function run() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  console.log(`Found ${files.length} migration file(s).\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Running: ${file}...`);
    const { error } = await supabaseAdmin.rpc("exec_sql", { query: sql }).single();

    if (error) {
      console.error(`  Error in ${file}:`, error.message);
      console.log("  Tip: You may need to run this SQL directly in the Supabase SQL Editor.");
    } else {
      console.log(`  ✓ Done`);
    }
  }

  console.log("\nMigrations complete.");
}

run().catch(console.error);
