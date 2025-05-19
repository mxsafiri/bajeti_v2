# Supabase Setup

## Overview

Bajeti v2 uses Supabase as its backend platform, providing PostgreSQL database, authentication, storage, and serverless functions. This document outlines the setup process and configuration details.

## Project Setup

### Creating a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io)
2. Click "New Project"
3. Enter project details:
   - Name: `bajeti-v2`
   - Database Password: Generate a strong password
   - Region: Choose closest to target users
4. Click "Create New Project"

### Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For production, set these environment variables in your hosting platform (e.g., Vercel).

## Database Setup

### Schema Initialization

Execute the SQL from `database-schema.md` to set up the initial database schema. You can run this in the Supabase SQL Editor.

### Row Level Security (RLS)

Ensure RLS is enabled on all tables with appropriate policies:

```sql
-- Example for the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Database Functions

Create stored procedures for complex operations:

```sql
-- Example: Create budget with categories in a transaction
CREATE OR REPLACE FUNCTION create_budget_with_categories(
  p_name TEXT,
  p_description TEXT,
  p_amount DECIMAL,
  p_currency TEXT,
  p_period TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_is_recurring BOOLEAN,
  p_user_id UUID,
  p_categories JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_budget_id UUID;
  v_category JSONB;
  v_result JSONB;
BEGIN
  -- Insert budget
  INSERT INTO budgets (
    user_id,
    name,
    description,
    amount,
    currency,
    period,
    start_date,
    end_date,
    is_recurring
  ) VALUES (
    p_user_id,
    p_name,
    p_description,
    p_amount,
    p_currency,
    p_period,
    p_start_date,
    p_end_date,
    p_is_recurring
  )
  RETURNING id INTO v_budget_id;
  
  -- Insert budget categories
  FOR v_category IN SELECT * FROM jsonb_array_elements(p_categories)
  LOOP
    INSERT INTO budget_categories (
      budget_id,
      category_id,
      allocated_amount
    ) VALUES (
      v_budget_id,
      (v_category->>'categoryId')::UUID,
      (v_category->>'allocatedAmount')::DECIMAL
    );
  END LOOP;
  
  -- Return the created budget
  SELECT jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'amount', b.amount,
    'categories', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', bc.id,
        'categoryId', bc.category_id,
        'allocatedAmount', bc.allocated_amount
      ))
      FROM budget_categories bc
      WHERE bc.budget_id = b.id
    )
  )
  FROM budgets b
  WHERE b.id = v_budget_id
  INTO v_result;
  
  RETURN v_result;
END;
$$;
```

## Authentication Setup

### Email Authentication

1. Go to Authentication → Settings
2. Enable Email provider
3. Configure Site URL to match your frontend URL
4. Customize email templates for:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password

### Social Providers (Optional)

1. Go to Authentication → Settings
2. Enable desired providers (Google, Apple, etc.)
3. Configure OAuth credentials for each provider

## Storage Setup

### Buckets Configuration

Create the following storage buckets:

```sql
-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'Receipts', false);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'User Avatars', true);

-- Create exports bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exports', 'Exported Reports', false);
```

### Storage Policies

Set up RLS policies for storage:

```sql
-- Receipts bucket policies
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Avatars bucket policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Edge Functions

### Function Setup

Create the following edge functions:

1. **Generate Financial Report**

```typescript
// supabase/functions/generate-financial-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReportParams {
  userId: string;
  startDate: string;
  endDate: string;
  reportType: 'spending' | 'income' | 'budget';
}

serve(async (req) => {
  // Get request body
  const { userId, startDate, endDate, reportType } = await req.json() as ReportParams;
  
  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate report based on type
    let reportData;
    
    switch (reportType) {
      case 'spending':
        reportData = await generateSpendingReport(supabase, userId, startDate, endDate);
        break;
      case 'income':
        reportData = await generateIncomeReport(supabase, userId, startDate, endDate);
        break;
      case 'budget':
        reportData = await generateBudgetReport(supabase, userId, startDate, endDate);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify({ data: reportData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions for report generation
async function generateSpendingReport(supabase, userId, startDate, endDate) {
  // Implementation details
}

async function generateIncomeReport(supabase, userId, startDate, endDate) {
  // Implementation details
}

async function generateBudgetReport(supabase, userId, startDate, endDate) {
  // Implementation details
}
```

2. **AI Financial Insights**

```typescript
// supabase/functions/ai-financial-insights/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

serve(async (req) => {
  // Get request body
  const { userId, timeframe } = await req.json();
  
  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Create OpenAI client
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  const openai = new OpenAIApi(configuration);
  
  try {
    // Get user's financial data
    const financialData = await getUserFinancialData(supabase, userId, timeframe);
    
    // Generate insights using OpenAI
    const insights = await generateInsights(openai, financialData);
    
    return new Response(
      JSON.stringify({ data: insights }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
async function getUserFinancialData(supabase, userId, timeframe) {
  // Implementation details
}

async function generateInsights(openai, financialData) {
  // Implementation details
}
```

### Deployment

Deploy edge functions using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-id

# Deploy functions
supabase functions deploy generate-financial-report
supabase functions deploy ai-financial-insights

# Set environment variables
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

## Realtime Configuration

Enable realtime for specific tables:

1. Go to Database → Replication
2. Enable realtime for the following tables:
   - transactions
   - budgets
   - budget_categories

## Webhooks (Optional)

Set up webhooks for important events:

1. Go to Database → Webhooks
2. Create a new webhook:
   - Name: `transaction_created`
   - Table: `transactions`
   - Events: `INSERT`
   - URL: Your webhook endpoint (e.g., `/api/webhooks/transaction-created`)

## Monitoring and Maintenance

### Health Checks

Set up regular health checks:

```sql
-- Create a health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS JSONB
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'database', current_database(),
    'version', version()
  );
$$;
```

### Backup Strategy

1. Enable point-in-time recovery (PITR)
2. Schedule regular backups
3. Document restoration procedures

## Security Considerations

1. Regularly rotate API keys
2. Use service role key only in secure server environments
3. Implement proper RLS policies for all tables
4. Use parameterized queries to prevent SQL injection
5. Audit database access regularly
