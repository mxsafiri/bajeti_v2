# Database Schema

## Overview

Bajeti v2 uses a PostgreSQL database managed through Supabase. The schema is designed to efficiently store and relate financial data while maintaining data integrity and enabling complex queries.

## Core Tables

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own data
CREATE POLICY "Users can only view their own data" 
  ON users FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE USING (auth.uid() = id);
```

### Budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can CRUD their own budgets" 
  ON budgets USING (auth.uid() = user_id);
```

### Categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_income BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view system categories and their own" 
  ON categories FOR SELECT USING (is_system OR auth.uid() = user_id);
  
CREATE POLICY "Users can CRUD their own categories" 
  ON categories FOR ALL USING (auth.uid() = user_id AND NOT is_system);
```

### Budget_Categories
```sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);

-- Enable Row Level Security
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own budget categories" 
  ON budget_categories USING (
    auth.uid() = (SELECT user_id FROM budgets WHERE id = budget_id)
  );
```

### Transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  is_income BOOLEAN DEFAULT FALSE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can CRUD their own transactions" 
  ON transactions USING (auth.uid() = user_id);
```

### Financial_Accounts
```sql
CREATE TABLE financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can CRUD their own accounts" 
  ON financial_accounts USING (auth.uid() = user_id);
```

## Views

### Budget_Summary
```sql
CREATE VIEW budget_summary AS
SELECT 
  b.id AS budget_id,
  b.name AS budget_name,
  b.amount AS total_budget,
  b.period,
  b.start_date,
  b.end_date,
  COALESCE(SUM(t.amount), 0) AS spent_amount,
  b.amount - COALESCE(SUM(t.amount), 0) AS remaining_amount,
  (COALESCE(SUM(t.amount), 0) / b.amount * 100) AS percent_used
FROM budgets b
LEFT JOIN transactions t ON 
  t.user_id = b.user_id AND 
  t.date BETWEEN b.start_date AND COALESCE(b.end_date, CURRENT_DATE) AND
  t.is_income = FALSE
GROUP BY b.id, b.name, b.amount, b.period, b.start_date, b.end_date;
```

### Category_Spending
```sql
CREATE VIEW category_spending AS
SELECT 
  c.id AS category_id,
  c.name AS category_name,
  c.user_id,
  SUM(t.amount) AS total_spent,
  COUNT(t.id) AS transaction_count,
  MIN(t.date) AS first_transaction_date,
  MAX(t.date) AS last_transaction_date
FROM categories c
JOIN transactions t ON c.id = t.category_id
WHERE t.is_income = FALSE
GROUP BY c.id, c.name, c.user_id;
```

## Functions and Triggers

### Update Budget Status
```sql
CREATE OR REPLACE FUNCTION update_budget_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp for the affected budget
  UPDATE budgets
  SET updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT b.id
    FROM budgets b
    WHERE b.user_id = NEW.user_id
    AND NEW.date BETWEEN b.start_date AND COALESCE(b.end_date, CURRENT_DATE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_budget_status();
```

## Indexes

```sql
-- Improve query performance for common operations
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, period, start_date, end_date);
```

## Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```
