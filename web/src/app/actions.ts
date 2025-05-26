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
    
    const { error } = await supabase.auth.signInWithPassword({
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
    
    // Success - let the middleware handle the redirect
    return { success: true }
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
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    
    if (signUpError) {
      console.error('Sign up error:', signUpError)
      
      if (signUpError.message.includes('already registered')) {
        return { error: 'This email is already registered. Please sign in instead.' }
      }
      
      if (signUpError.message.includes('password')) {
        return { error: 'Password must be at least 6 characters.' }
      }
      
      return { error: signUpError.message }
    }
    
    return { 
      success: true,
      message: 'Please check your email to verify your account.'
    }
  } catch (err) {
    console.error('Unexpected error during sign-up:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    
    // Sign out from all tabs/windows
    const { error } = await supabase.auth.signOut({
      scope: 'global'
    })
    
    if (error) {
      console.error('Sign out error:', error)
      return { error: 'Failed to sign out' }
    }
    
    // Clear cookies and local storage
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
    localStorage.clear()
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error during sign-out:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
