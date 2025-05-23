-- Add new fields to public.users table for settings page functionality

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT NULL,
ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL,
ADD COLUMN IF NOT EXISTS phone TEXT NULL,
ADD COLUMN IF NOT EXISTS language TEXT NULL DEFAULT 'English',
ADD COLUMN IF NOT EXISTS currency TEXT NULL DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS theme TEXT NULL DEFAULT 'system';

-- Note: Consider updating RLS policies if these new columns need specific permissions
-- beyond the existing owner-based policies.
-- Also, ensure your application logic updates the 'updated_at' timestamp for the users table
-- when these fields are modified.