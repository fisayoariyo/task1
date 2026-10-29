import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { getCurrentUser, login, logout, register } from '../lib/api.js'
import { authReducer, initialAuthState } from '../lib/authState.js'
import { AuthContext } from './auth.js'

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState('login')

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'session-loading' })
    try {
      const user = await getCurrentUser()
      dispatch({ type: 'user-authenticated', user })
      return user
    } catch (error) {
      if (error?.status === 401) {
        dispatch({ type: 'session-anonymous' })
        return null
      }
      dispatch({ type: 'session-error', error })
      return null
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const openAuth = useCallback((nextMode = 'login') => {
    if (nextMode !== 'login' && nextMode !== 'register') {
      throw new Error(`Unsupported auth mode: ${nextMode}`)
    }
    setMode(nextMode)
    setDialogOpen(true)
  }, [])

  const closeAuth = useCallback(() => setDialogOpen(false), [])

  const signIn = useCallback(async (credentials) => {
    const user = await login(credentials)
    dispatch({ type: 'user-authenticated', user })
    return user
  }, [])

  const signUp = useCallback(async (credentials) => {
    const user = await register(credentials)
    dispatch({ type: 'user-authenticated', user })
    return user
  }, [])

  const signOut = useCallback(async () => {
    await logout()
    dispatch({ type: 'logout-success' })
  }, [])

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      error: state.error,
      dialogOpen,
      mode,
      openAuth,
      closeAuth,
      refreshSession,
      signIn,
      signUp,
      signOut,
    }),
    [
      state.user,
      state.status,
      state.error,
      dialogOpen,
      mode,
      openAuth,
      closeAuth,
      refreshSession,
      signIn,
      signUp,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
