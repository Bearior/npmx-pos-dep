-- Function to get database size in MB
CREATE OR REPLACE FUNCTION get_db_size()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database()) / (1024.0 * 1024.0);
$$;
