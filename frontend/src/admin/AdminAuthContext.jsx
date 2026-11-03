import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminLogin, adminLogout, adminMe } from '../lib/api'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    adminMe()
      .then((user) => {
        if (!cancelled) setAdmin(user)
      })
      .catch(() => {
        if (!cancelled) setAdmin(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const user = await adminLogin(credentials)
    setAdmin(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminLogout()
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = useMemo(
    () => ({ admin, loading, login, logout, setAdmin }),
    [admin, loading, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth requires AdminAuthProvider')
  return ctx
}
