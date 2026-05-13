-- ============================================================
-- FIX: Ensure student INSERT policies work for borrows & reservations
-- Also ensures notifications INSERT works for students
-- Run in Supabase → SQL Editor → New Query
-- ============================================================

-- Check current policies on borrows
select tablename, policyname, cmd, qual, with_check
from pg_policies
where tablename in ('borrows','reservations','notifications')
and schemaname = 'public'
order by tablename, cmd;
