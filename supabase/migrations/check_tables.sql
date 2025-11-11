-- Quick Test Query: Check if splits table exists
-- Run this FIRST to verify if the table exists

SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('splits', 'split_participants', 'split_payments')
ORDER BY table_name;

-- If this returns 0 rows, you need to run the migration
-- If it returns 3 rows, the tables exist and you're good to go!

