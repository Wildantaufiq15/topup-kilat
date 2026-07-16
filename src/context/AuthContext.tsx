'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isProfileLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; name: string; password: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const profileFetchedRef = useRef(false)

  // Fetch user profile from users table
  const fetchProfile = useCallback(async (userId: string) => {
    setIsProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        // Profile might not exist yet (just registered)
        setProfile(null)
        return
      }

      setProfile(data)
      profileFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setIsProfileLoading(false)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      }

      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          profileFetchedRef.current = false
        }

        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Profile will be fetched via onAuthStateChange
  }

  const register = async (data: { email: string; name: string; password: string; phone?: string }) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Registration failed')
    }

    // Create user profile in users table with retry
    let profileError = null
    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      const { error } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        phone: data.phone || null,
        role: 'USER',
        member_tier: 'BRONZE',
        points_balance: 0,
        is_verified: false,
        is_active: true,
      })

      if (!error) {
        profileError = null
        break
      }

      profileError = error
      console.warn(`Profile creation attempt ${retries + 1} failed:`, error.message)
      retries++

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (profileError) {
      console.error('Error creating profile after retries:', profileError)
      // Don't throw - user was created in auth, profile can be created later
      // The profile will be created on next login or can be created manually
    }

    // Fetch the created profile
    await fetchProfile(authData.user.id)
  }

  const logout = async () => {
    // Clear checkout state from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('topupkilat_checkout_state')
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    setProfile(null)
    profileFetchedRef.current = false
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isProfileLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
