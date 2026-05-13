-- Rename profiles table to "user"
-- Note: "user" is a reserved keyword in Postgres, so it must be quoted.

ALTER TABLE public.profiles RENAME TO "user";

-- Update the user creation trigger function to write into the renamed table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."user" (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

