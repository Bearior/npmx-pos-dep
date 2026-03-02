/**
 * Seed test users into Supabase Auth + profiles table.
 *
 * Usage:  node migrations/seeds/seed_users.js
 *
 * ┌───────────┬─────────────────────────┬──────────────┐
 * │ Role      │ Email                   │ Password     │
 * ├───────────┼─────────────────────────┼──────────────┤
 * │ admin     │ admin@npmx.cafe         │ admin1234    │
 * │ manager   │ manager@npmx.cafe       │ manager1234  │
 * │ cashier   │ cashier1@npmx.cafe      │ cashier1234  │
 * │ cashier   │ cashier2@npmx.cafe      │ cashier1234  │
 * └───────────┴─────────────────────────┴──────────────┘
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", "config", "config.env") });

const { supabaseAdmin } = require("../../config/supabase");

const TEST_USERS = [
  {
    email: "admin@npmx.cafe",
    password: "admin1234",
    full_name: "NPMX Admin",
    phone: "081-000-0001",
    role: "admin",
  },
  {
    email: "manager@npmx.cafe",
    password: "manager1234",
    full_name: "Store Manager",
    phone: "081-000-0002",
    role: "manager",
  },
  {
    email: "cashier1@npmx.cafe",
    password: "cashier1234",
    full_name: "Cashier One",
    phone: "081-000-0003",
    role: "cashier",
  },
  {
    email: "cashier2@npmx.cafe",
    password: "cashier1234",
    full_name: "Cashier Two",
    phone: "081-000-0004",
    role: "cashier",
  },
];

async function seedUsers() {
  console.log("Seeding test users...\n");

  for (const user of TEST_USERS) {
    // 1. Create auth user (skip if already exists)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.status === 422) {
        console.log(`  ⏭  ${user.email} already exists – skipping`);
        continue;
      }
      console.error(`  ✗  ${user.email} – ${error.message}`);
      continue;
    }

    // 2. Insert profile row
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
      {
        id: data.user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      console.error(`  ✗  Profile for ${user.email} – ${profileErr.message}`);
    } else {
      console.log(`  ✓  ${user.role.padEnd(8)} ${user.email}`);
    }
  }

  console.log("\nDone! Test users seeded.\n");

  console.log("Login credentials:");
  console.log("─".repeat(55));
  console.log("Role      │ Email                   │ Password");
  console.log("─".repeat(55));
  for (const u of TEST_USERS) {
    console.log(`${u.role.padEnd(9)} │ ${u.email.padEnd(23)} │ ${u.password}`);
  }
  console.log("─".repeat(55));
}

seedUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
