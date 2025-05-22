'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function signIn(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) {
      return { error: 'Email and password are required' }
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign-in error:', error)
      
      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please verify your email address before signing in.' }
      }
      
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' }
      }
      
      return { error: `Authentication failed: ${error.message}` }
    }
    
    if (!data.session) {
      return { error: 'Failed to create session. Please verify your email first.' }
    }
    
    return redirect('/dashboard')
  } catch (err) {
    console.error('Unexpected error during sign-in:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signUp(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    
    if (!email || !password || !fullName) {
      return { error: 'All fields are required' }
    }
    
    const supabase = await createClient()
    
    // First, sign up the user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          email_redirect_to: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    })
    
    if (signUpError) {
      console.error('Sign up error:', signUpError)
      
      // Handle specific error cases
      if (signUpError.message.includes('already registered')) {
        return { error: 'This email is already registered. Please sign in instead.' }
      }
      
      if (signUpError.message.includes('password')) {
        return { error: 'Password does not meet requirements. Please use at least 6 characters.' }
      }
      
      return { error: `Failed to create account: ${signUpError.message}` }
    }
    
    // If we get here, the user was created successfully
    // The database trigger will create the user profile in the public.users table
    
    return { 
      success: 'Account created successfully! Please check your email to confirm your account.' 
    }
  } catch (error) {
    console.error('Unexpected error during sign up:', error)
    return { error: 'An unexpected error occurred. Please try again later.' }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
