import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { DEMO_MODE } from '../lib/constants'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  configMissing: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const demoUser = {
  id: 'demo-user',
  email: 'owner@demo.local',
  app_metadata: {},
  user_metadata: { full_name: 'مدير البوابة' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(DEMO_MODE ? demoUser : null)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [authError, setAuthError] = useState<string | null>(null)

  const configMissing = !DEMO_MODE && !isSupabaseConfigured

  const enforceOwner = useCallback(async (nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null

    if (!nextUser) {
      setSession(null)
      setUser(null)
      setAuthError(null)
      return
    }

    const { data: isOwner, error } = await supabase.rpc('is_portal_owner')

    if (error || isOwner !== true) {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setAuthError('هذا الحساب غير مصرح له بالدخول إلى البوابة.')
      return
    }

    setSession(nextSession)
    setUser(nextUser)
    setAuthError(null)
  }, [])

  useEffect(() => {
    if (DEMO_MODE || configMissing) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        setAuthError('تعذر التحقق من جلسة الدخول.')
        setLoading(false)
        return
      }
      void enforceOwner(data.session).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      window.setTimeout(() => {
        if (mounted) void enforceOwner(nextSession)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [configMissing, enforceOwner])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null)

    if (DEMO_MODE) {
      setUser(demoUser)
      return
    }

    if (!isSupabaseConfigured) {
      setAuthError('لم يتم ربط مشروع Supabase بعد.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setAuthError('بيانات الدخول غير صحيحة، تحقق من البريد وكلمة المرور.')
      return
    }

    await enforceOwner(data.session)
  }, [enforceOwner])

  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    configMissing,
    authError,
    signIn,
    signOut,
  }), [user, session, loading, configMissing, authError, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
