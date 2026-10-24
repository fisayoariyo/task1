import { Navigate, Route, Routes } from 'react-router-dom'
import Checkout from './pages/Checkout'
import Discovery from './pages/Discovery'
import Landing from './pages/Landing'
import Restaurant from './pages/Restaurant'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/discovery" element={<Discovery />} />
      <Route path="/restaurant/:id?" element={<Restaurant />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* Old static URLs → clean paths */}
      <Route path="/web/landing.html" element={<Navigate to="/" replace />} />
      <Route path="/web/landing" element={<Navigate to="/" replace />} />
      <Route path="/web/discovery.html" element={<Navigate to="/discovery" replace />} />
      <Route path="/web/discovery" element={<Navigate to="/discovery" replace />} />
      <Route path="/web/restaurant.html" element={<Navigate to="/restaurant" replace />} />
      <Route path="/web/restaurant" element={<Navigate to="/restaurant" replace />} />
      <Route path="/web/checkout.html" element={<Navigate to="/checkout" replace />} />
      <Route path="/web/checkout" element={<Navigate to="/checkout" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
