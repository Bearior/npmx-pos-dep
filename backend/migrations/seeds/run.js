/**
 * Seed runner – executes seed SQL files.
 * Usage: node migrations/seeds/run.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", "config", "config.env") });

const { supabaseAdmin } = require("../../config/supabase");

async function run() {
  const seedsDir = __dirname;
  const files = fs.readdirSync(seedsDir).filter((f) => f.endsWith(".sql")).sort();

  console.log(`Found ${files.length} seed file(s).\n`);

  for (const file of files) {
    const filePath = path.join(seedsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Seeding: ${file}...`);
    const { error } = await supabaseAdmin.rpc("exec_sql", { query: sql }).single();

    if (error) {
      console.error(`  Error in ${file}:`, error.message);
      console.log("  Tip: Run this SQL directly in the Supabase SQL Editor.");
    } else {
      console.log(`  ✓ Done`);
    }
  }

  console.log("\nSeeding complete.");
}

run().catch(console.error);
