'use server'

import { cookies } from 'next/headers'
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
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: 'Check your email to confirm your account' }
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
