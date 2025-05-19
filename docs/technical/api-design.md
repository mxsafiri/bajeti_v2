# API Design

## Overview

Bajeti v2 uses a combination of Next.js API routes and direct Supabase client interactions. This document outlines the API structure, endpoints, and best practices.

## API Structure

### Authentication

```typescript
// POST /api/auth/signup
interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
}

interface SignupResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

// POST /api/auth/signin
interface SigninRequest {
  email: string;
  password: string;
}

interface SigninResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

// POST /api/auth/signout
// No request body needed
interface SignoutResponse {
  success: boolean;
  error?: string;
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  email: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
}
```

### Budgets

```typescript
// GET /api/budgets
interface GetBudgetsRequest {
  period?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface GetBudgetsResponse {
  data: Budget[];
  count: number;
  error?: string;
}

// GET /api/budgets/:id
interface GetBudgetResponse {
  data: Budget | null;
  error?: string;
}

// POST /api/budgets
interface CreateBudgetRequest {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  period: string;
  startDate: string;
  endDate?: string;
  isRecurring?: boolean;
  categories?: {
    categoryId: string;
    allocatedAmount: number;
  }[];
}

interface CreateBudgetResponse {
  data: Budget | null;
  error?: string;
}

// PUT /api/budgets/:id
interface UpdateBudgetRequest {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
}

interface UpdateBudgetResponse {
  data: Budget | null;
  error?: string;
}

// DELETE /api/budgets/:id
interface DeleteBudgetResponse {
  success: boolean;
  error?: string;
}
```

### Transactions

```typescript
// GET /api/transactions
interface GetTransactionsRequest {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  isIncome?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetTransactionsResponse {
  data: Transaction[];
  count: number;
  error?: string;
}

// GET /api/transactions/:id
interface GetTransactionResponse {
  data: Transaction | null;
  error?: string;
}

// POST /api/transactions
interface CreateTransactionRequest {
  categoryId?: string;
  amount: number;
  description?: string;
  date: string;
  isIncome?: boolean;
  receipt?: File;
}

interface CreateTransactionResponse {
  data: Transaction | null;
  error?: string;
}

// PUT /api/transactions/:id
interface UpdateTransactionRequest {
  categoryId?: string;
  amount?: number;
  description?: string;
  date?: string;
  isIncome?: boolean;
  receipt?: File;
}

interface UpdateTransactionResponse {
  data: Transaction | null;
  error?: string;
}

// DELETE /api/transactions/:id
interface DeleteTransactionResponse {
  success: boolean;
  error?: string;
}
```

### Categories

```typescript
// GET /api/categories
interface GetCategoriesResponse {
  data: Category[];
  error?: string;
}

// POST /api/categories
interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  isIncome?: boolean;
}

interface CreateCategoryResponse {
  data: Category | null;
  error?: string;
}

// PUT /api/categories/:id
interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  isIncome?: boolean;
}

interface UpdateCategoryResponse {
  data: Category | null;
  error?: string;
}

// DELETE /api/categories/:id
interface DeleteCategoryResponse {
  success: boolean;
  error?: string;
}
```

### Reports & Insights

```typescript
// GET /api/reports/spending
interface GetSpendingReportRequest {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month' | 'category';
}

interface GetSpendingReportResponse {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
  error?: string;
}

// GET /api/insights
interface GetInsightsRequest {
  timeframe: 'week' | 'month' | 'year';
}

interface GetInsightsResponse {
  data: {
    topCategories: {
      category: string;
      amount: number;
      percentage: number;
    }[];
    spendingTrend: {
      date: string;
      amount: number;
    }[];
    anomalies: {
      category: string;
      amount: number;
      percentageChange: number;
      message: string;
    }[];
    recommendations: {
      type: string;
      message: string;
      potentialSavings?: number;
    }[];
  };
  error?: string;
}
```

## API Implementation Patterns

### Next.js API Routes

```typescript
// Example API route implementation
// /api/budgets/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Initialize Supabase client with server context
  const supabase = createServerSupabaseClient({ req, res });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res, supabase, session);
    case 'POST':
      return handlePost(req, res, supabase, session);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET handler implementation
async function handleGet(req, res, supabase, session) {
  // Extract query parameters
  const { period, startDate, endDate, limit = 10, offset = 0 } = req.query;
  
  // Build query
  let query = supabase
    .from('budgets')
    .select('*', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Apply filters if provided
  if (period) {
    query = query.eq('period', period);
  }
  
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  
  if (endDate) {
    query = query.lte('end_date', endDate);
  }
  
  // Execute query
  const { data, error, count } = await query;
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json({ data, count });
}

// POST handler implementation
async function handlePost(req, res, supabase, session) {
  // Extract request body
  const { 
    name, 
    description, 
    amount, 
    currency = 'USD', 
    period, 
    startDate, 
    endDate, 
    isRecurring = false,
    categories = []
  } = req.body;
  
  // Validate required fields
  if (!name || !amount || !period || !startDate) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, amount, period, startDate' 
    });
  }
  
  // Start a transaction
  const { data, error } = await supabase.rpc('create_budget_with_categories', {
    p_name: name,
    p_description: description || null,
    p_amount: amount,
    p_currency: currency,
    p_period: period,
    p_start_date: startDate,
    p_end_date: endDate || null,
    p_is_recurring: isRecurring,
    p_user_id: session.user.id,
    p_categories: categories
  });
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(201).json({ data });
}
```

### Direct Client Interactions

```typescript
// Example client-side data fetching
// hooks/useBudgets.ts
import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export function useBudgets(options = {}) {
  const { 
    period, 
    startDate, 
    endDate, 
    limit = 10, 
    page = 1 
  } = options;
  
  const [budgets, setBudgets] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const supabase = useSupabaseClient();
  const user = useUser();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchBudgets = async () => {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('budgets')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (period) {
        query = query.eq('period', period);
      }
      
      if (startDate) {
        query = query.gte('start_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('end_date', endDate);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        setError(error.message);
      } else {
        setBudgets(data || []);
        setCount(count || 0);
      }
      
      setLoading(false);
    };
    
    fetchBudgets();
  }, [user, period, startDate, endDate, limit, page, supabase]);
  
  return { budgets, count, loading, error };
}
```

## Error Handling

All API responses follow a consistent error format:

```typescript
interface ErrorResponse {
  error: string;
  details?: any;
  code?: string;
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (invalid input)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 409: Conflict (e.g., duplicate resource)
- 422: Unprocessable Entity (validation failed)
- 500: Internal Server Error

## API Security

- All API routes are protected with Supabase Auth
- JWT validation for authentication
- Row-level security in the database
- Rate limiting to prevent abuse
- CORS configuration to restrict origins
- Input validation to prevent injection attacks
