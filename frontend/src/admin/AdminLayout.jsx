import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext'

export default function AdminLayout() {
  const { admin, loading, logout } = useAdminAuth()

  if (loading) {
    return (
      <div className="admin-shell admin-login">
        <p className="admin-muted">Loading…</p>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="admin-shell admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">NomNom Admin</div>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Customers
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Orders
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Settings
          </NavLink>
        </nav>
        <div className="admin-sidebar__foot">
          <div className="admin-sidebar__user">{admin.username}</div>
          <button className="admin-btn admin-btn--ghost" type="button" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
