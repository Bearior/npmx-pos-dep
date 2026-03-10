const { supabaseAdmin } = require("../../../config/supabase");

// Supabase tier limits
const TIER_LIMITS = {
  free: { db_mb: 500, storage_gb: 1, label: "Free" },
  pro: { db_mb: 8192, storage_gb: 100, label: "Pro" },
  team: { db_mb: 8192, storage_gb: 100, label: "Team" },
  enterprise: { db_mb: 16384, storage_gb: 200, label: "Enterprise" },
};

module.exports = async (req, res) => {
  try {
    // Query database size via pg_database_size
    const { data: dbSizeData, error: dbError } = await supabaseAdmin.rpc("pg_database_size_pretty");

    let dbSizeMb = 0;
    let dbSizeRaw = null;

    if (!dbError && dbSizeData !== null) {
      dbSizeRaw = dbSizeData;
    }

    // Fallback: query estimated DB size from pg_stat tables
    const { data: dbStats, error: dbStatsError } = await supabaseAdmin
      .from("pg_stat_user_tables")
      .select("schemaname, relname");

    // Get actual DB size via raw SQL using rpc
    const { data: sizeResult, error: sizeError } = await supabaseAdmin.rpc("get_db_size");

    if (!sizeError && sizeResult !== null) {
      dbSizeMb = parseFloat(sizeResult);
    }

    // Get storage usage - list all buckets and calculate total
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

    let storageSizeMb = 0;
    if (!bucketsError && buckets) {
      for (const bucket of buckets) {
        try {
          const { data: files, error: filesError } = await supabaseAdmin.storage
            .from(bucket.name)
            .list("", { limit: 1000 });

          if (!filesError && files) {
            for (const file of files) {
              if (file.metadata && file.metadata.size) {
                storageSizeMb += file.metadata.size / (1024 * 1024);
              }
            }
          }
        } catch {
          // Skip bucket if listing fails
        }
      }
    }

    // Determine tier (default to free)
    const tier = process.env.SUPABASE_TIER || "free";
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    res.json({
      tier: limits.label,
      database: {
        used_mb: Math.round(dbSizeMb * 100) / 100,
        max_mb: limits.db_mb,
        percentage: limits.db_mb > 0 ? Math.round((dbSizeMb / limits.db_mb) * 10000) / 100 : 0,
      },
      storage: {
        used_mb: Math.round(storageSizeMb * 100) / 100,
        max_gb: limits.storage_gb,
        max_mb: limits.storage_gb * 1024,
        percentage:
          limits.storage_gb > 0
            ? Math.round((storageSizeMb / (limits.storage_gb * 1024)) * 10000) / 100
            : 0,
      },
    });
  } catch (err) {
    console.error("getSupabaseStatus error:", err);
    res.status(500).json({ error: "Failed to fetch Supabase status" });
  }
};
