import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { getCurrentUser, login, logout, register } from '../lib/api.js'
import { authReducer, initialAuthState } from '../lib/authState.js'
import { AuthContext } from './auth.js'
import { AuthDialog } from '../components/AuthDialog'

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const sessionRequestRef = useRef(0)

  const refreshSession = useCallback(async () => {
    const requestId = ++sessionRequestRef.current
    dispatch({ type: 'session-loading' })
    try {
      const user = await getCurrentUser()
      if (requestId === sessionRequestRef.current) {
        dispatch({ type: 'user-authenticated', user })
      }
      return user
    } catch (error) {
      if (requestId !== sessionRequestRef.current) return null
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
    const requestId = ++sessionRequestRef.current
    const user = await login(credentials)
    if (requestId === sessionRequestRef.current) {
      dispatch({ type: 'user-authenticated', user })
    }
    return user
  }, [])

  const signUp = useCallback(async (credentials) => {
    const requestId = ++sessionRequestRef.current
    const user = await register(credentials)
    if (requestId === sessionRequestRef.current) {
      dispatch({ type: 'user-authenticated', user })
    }
    return user
  }, [])

  const signOut = useCallback(async () => {
    const requestId = ++sessionRequestRef.current
    await logout()
    if (requestId === sessionRequestRef.current) {
      dispatch({ type: 'logout-success' })
    }
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog open={dialogOpen} mode={mode} onClose={closeAuth} />
    </AuthContext.Provider>
  )
}
