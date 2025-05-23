"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Database } from '@/lib/database.types';

// This type represents the data collected by the form
type BudgetFormInput = {
  month: string;
  year: string;
  amount: string;
  categoryId: string;
};

const BudgetForm = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authUserId, setAuthUserId] = useState<string | null>(null); // Stores the UUID from auth.user
  const [dbUserId, setDbUserId] = useState<number | null>(null); // Stores the numeric ID from public.users table
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);


  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setErrorState(null);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        setErrorState('Failed to fetch user session.');
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setAuthUserId(session.user.id);
        // Now fetch the numeric ID from the public.users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setErrorState('Failed to fetch user profile.');
          setDbUserId(null); // Ensure dbUserId is null if profile fetch fails
        } else if (userProfile) {
          setDbUserId(userProfile.id);
        } else {
          console.warn('No user profile found for authenticated user.');
          setErrorState('User profile not found.');
          setDbUserId(null);
        }
      } else {
        console.warn('No user session found.');
        setErrorState('You must be logged in to add a budget.');
        setAuthUserId(null);
        setDbUserId(null);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorState(null); // Clear previous errors

    if (!dbUserId) {
      console.error('Database User ID is not available. Cannot submit budget.');
      setErrorState('User information is missing. Please try logging in again.');
      return;
    }
    if (!month || !year || !amount || !categoryId) {
      console.error('All fields are required.');
      setErrorState('All fields are required. Please fill out month, year, amount, and category ID.');
      return;
    }

    setIsLoading(true); // Correctly placed: set loading before async operations start

    // Data for the 'budgets' table
    const budgetInsertData: Database['public']['Tables']['budgets']['Insert'] = {
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      user_id: dbUserId, // Use the numeric dbUserId here
    };

    // Step 1: Insert into 'budgets' table
    const { data: budgetResult, error: budgetError } = await supabase
      .from('budgets')
      .insert(budgetInsertData)
      .select() // Important to get the ID of the inserted budget
      .single(); // Assuming we insert one budget and want its result

    if (budgetError) {
      console.error('Error inserting budget:', budgetError);
      setErrorState(`Failed to create budget: ${budgetError.message}`);
      setIsLoading(false);
      return;
    }

    if (!budgetResult) {
      console.error('No data returned after inserting budget.');
      setErrorState('Budget created, but no confirmation data received.');
      setIsLoading(false);
      return;
    }

    console.log('Budget inserted:', budgetResult);
    const newBudgetId = budgetResult.id;

    // Step 2: Insert into 'budget_categories' table
    const budgetCategoryInsertData: Database['public']['Tables']['budget_categories']['Insert'] = {
      budget_id: newBudgetId,
      category_id: parseInt(categoryId, 10), // Assuming categoryId from form is the ID and needs parsing
      amount: parseFloat(amount),
    };

    const { data: budgetCategoryResult, error: budgetCategoryError } = await supabase
      .from('budget_categories')
      .insert(budgetCategoryInsertData)
      .select();

    setIsLoading(false);

    if (budgetCategoryError) {
      console.error('Error inserting budget category:', budgetCategoryError);
      setErrorState(`Budget created (ID: ${newBudgetId}), but failed to add category: ${budgetCategoryError.message}`);
      // Don't reset form here as the category part failed
    } else {
      console.log('Budget category inserted:', budgetCategoryResult);
      setErrorState(null); // Clear any previous error
      alert('Budget and category added successfully!'); // Simple success message
      // Reset form
      setMonth('');
      setYear('');
      setAmount('');
      setCategoryId('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* TODO: Consider using select dropdowns for month, year, and category for better UX */}
      <input type="number" placeholder="Month (1-12)" value={month} onChange={(e) => setMonth(e.target.value)} required />
      <input type="number" placeholder="Year (YYYY)" value={year} onChange={(e) => setYear(e.target.value)} required />
      <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" required />
      <input type="number" placeholder="Category ID" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required />
      <button type="submit" disabled={isLoading || !dbUserId}>
        {isLoading ? 'Processing...' : 'Add Budget'}
      </button>
      {errorState && <p style={{color: 'red'}}>{errorState}</p>}
    </form>
  );
};

export default BudgetForm;
