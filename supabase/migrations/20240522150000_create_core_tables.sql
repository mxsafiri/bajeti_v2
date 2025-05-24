-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search (optional, but in your schema doc)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Budgets Table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(auth_id) ON DELETE CASCADE, -- Assuming users.id in schema doc refers to users.auth_id from the first migration
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  period TEXT NOT NULL, -- 'monthly', 'weekly', 'annual', etc.
  start_date DATE NOT NULL,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own budgets" 
  ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(auth_id) ON DELETE CASCADE, -- Assuming users.id in schema doc refers to users.auth_id
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_income BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view system categories and their own" 
  ON public.categories FOR SELECT USING (is_system OR auth.uid() = user_id);
CREATE POLICY "Users can CRUD their own categories" 
  ON public.categories FOR ALL USING (auth.uid() = user_id AND NOT is_system);

-- Budget_Categories Table
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budget categories" 
  ON public.budget_categories FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.budgets WHERE id = budget_id)
  );

-- Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(auth_id) ON DELETE CASCADE, -- Assuming users.id in schema doc refers to users.auth_id
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Changed to ON DELETE SET NULL to avoid issues if a category is deleted
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  is_income BOOLEAN DEFAULT FALSE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own transactions" 
  ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Financial_Accounts Table
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(auth_id) ON DELETE CASCADE, -- Assuming users.id in schema doc refers to users.auth_id
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'checking', 'savings', 'credit', etc.
  balance DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  institution TEXT,
  account_mask TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own accounts" 
  ON public.financial_accounts FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_budgets_user_period ON public.budgets(user_id, period, start_date, end_date);

-- Note: The users table referenced here (public.users) is assumed to be the one
-- created by the 20240522140000_create_auth_tables.sql migration,
-- and user_id columns in other tables should reference its 'auth_id' (UUID) column,
-- not the bigint 'id' column, if 'auth_id' is the true foreign key to auth.users.
-- The schema doc used 'REFERENCES users(id)' which might be ambiguous.
-- I've used 'REFERENCES public.users(auth_id)' for consistency with the auth setup.
-- If your public.users table's primary key for relations is indeed 'id' (bigint),
-- you might need to adjust these REFERENCES clauses.

-- The functions and triggers (update_budget_status) and views (budget_summary, category_spending)
-- from your schema document can be added in a subsequent migration file if needed,
-- to keep this one focused on table creation and core RLS.