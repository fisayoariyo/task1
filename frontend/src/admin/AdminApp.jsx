import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './AdminAuthContext'
import AdminCustomers from './AdminCustomers'
import AdminLayout from './AdminLayout'
import AdminLogin from './AdminLogin'
import AdminOrders from './AdminOrders'
import AdminSettings from './AdminSettings'

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminCustomers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  )
}
