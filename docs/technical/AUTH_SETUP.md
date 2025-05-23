# Bajeti Authentication and Database Setup

## Overview
This document describes how authentication and user management is implemented in Bajeti using Supabase. We use a dual-table approach:
1. `auth.users` - Managed by Supabase Auth
2. `public.users` - Our application's user profiles

## Architecture

### Database Schema

#### 1. Auth Users (`auth.users`)
Managed by Supabase, contains authentication-specific data:
```sql
-- This is managed automatically by Supabase
auth.users {
  id: uuid (PK)              -- Primary identifier for auth
  email: string              -- User's email
  encrypted_password: string  -- Hashed password
  email_confirmed_at: timestamp
  raw_user_meta_data: jsonb  -- Custom user metadata
  created_at: timestamp
  updated_at: timestamp
}
```

#### 2. Public Users (`public.users`)
Our application's user profiles:
```sql
CREATE TABLE public.users (
  id: uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id: uuid UNIQUE REFERENCES auth.users(id),
  email: text,
  username: text,
  created_at: timestamp with time zone DEFAULT now(),
  updated_at: timestamp with time zone DEFAULT now()
);
```

### Automatic Profile Creation

When a user signs up, we automatically create their public profile using a database trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name text;
BEGIN
    -- Get display name from metadata or email
    display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Insert the new user
    INSERT INTO public.users (
        id,
        auth_id,
        email,
        username,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        NEW.id,            -- Link to auth.users
        NEW.email,
        display_name,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Row Level Security (RLS)

We implement RLS policies to ensure users can only access their own data:

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Enable select for users based on auth_id"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on auth_id"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());
```

## Frontend Implementation

### 1. Authentication Hook (`useUser`)

```typescript
export function useUser() {
  const [userData, setUserData] = useState<UserData>({
    auth: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = 
        await supabase.auth.getUser();
      
      if (authError) throw authError;

      if (!user) {
        setUserData({
          auth: null,
          profile: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = 
        await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

      if (profileError) throw profileError;

      setUserData({
        auth: {
          id: user.id,
          email: user.email!,
          email_confirmed_at: user.email_confirmed_at,
          phone: user.phone,
          last_sign_in_at: user.last_sign_in_at,
        },
        profile,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = 
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUserData();
        } else if (event === 'SIGNED_OUT') {
          setUserData({
            auth: null,
            profile: null,
            isLoading: false,
            error: null,
          });
        }
      });

    fetchUserData();
    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  return userData;
}
```

### 2. Sign Up Implementation

```typescript
export async function signUp(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    const { data: authData, error: signUpError } = 
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

    if (signUpError) throw signUpError;

    return { 
      success: 'Account created! Please check your email.' 
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      error: 'Failed to create account.' 
    };
  }
}
```

## Usage Examples

### 1. Protected Component
```typescript
function ProtectedComponent() {
  const { user, profile, isLoading } = useUser();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <h1>Welcome, {profile?.username}</h1>
      {/* Component content */}
    </div>
  );
}
```

### 2. Profile Update
```typescript
async function updateUserProfile(updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('auth_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## Security Considerations

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Users can only access their own data
   - Service role bypasses RLS for administrative tasks

2. **Authentication**
   - Passwords are hashed and managed by Supabase
   - JWT tokens are used for session management
   - Email verification is required

3. **Database Security**
   - Foreign key constraints prevent orphaned records
   - Unique constraints prevent duplicate profiles
   - Trigger functions use SECURITY DEFINER for proper permissions

## Best Practices

1. **Always use TypeScript** for type safety
2. **Implement proper error handling** in all auth-related functions
3. **Use the `useUser` hook** for consistent auth state management
4. **Never bypass RLS** unless absolutely necessary
5. **Keep auth and profile data separate** for better security
6. **Use environment variables** for sensitive configuration

## Testing

1. **Auth Flow Testing**
   ```typescript
   it('should create public profile on signup', async () => {
     const { user } = await supabase.auth.signUp({
       email: 'test@example.com',
       password: 'password123'
     });

     const { data: profile } = await supabase
       .from('users')
       .select('*')
       .eq('auth_id', user.id)
       .single();

     expect(profile).toBeTruthy();
     expect(profile.email).toBe('test@example.com');
   });
   ```

## Troubleshooting

1. **Missing Public Profile**
   - Check trigger function logs
   - Verify RLS policies
   - Ensure proper permissions

2. **Authentication Issues**
   - Check email confirmation status
   - Verify JWT token expiration
   - Review Supabase auth logs

## Contributing

When contributing to the auth system:
1. Never disable RLS
2. Always update documentation
3. Add appropriate tests
4. Follow TypeScript best practices
