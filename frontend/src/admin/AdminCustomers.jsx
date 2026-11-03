import { useCallback, useEffect, useState } from 'react'
import {
  adminBulkDeleteCustomers,
  adminDeleteCustomer,
  adminListCustomers,
} from '../lib/api'

export default function AdminCustomers() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminListCustomers()
      setRows(Array.isArray(data) ? data : [])
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === rows.length) return new Set()
      return new Set(rows.map((row) => row.id))
    })
  }

  async function deleteOne(id) {
    if (!window.confirm('Delete this customer?')) return
    setBusy(true)
    setError('')
    try {
      await adminDeleteCustomer(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSelected() {
    const ids = [...selected]
    if (!ids.length) return
    if (!window.confirm(`Delete ${ids.length} customer(s)?`)) return
    setBusy(true)
    setError('')
    try {
      await adminBulkDeleteCustomers(ids)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-main__header">
        <h1>Customers</h1>
        <div className="admin-toolbar">
          <button className="admin-btn admin-btn--ghost" type="button" onClick={load} disabled={busy}>
            Refresh
          </button>
          <button
            className="admin-btn admin-btn--danger"
            type="button"
            disabled={busy || selected.size === 0}
            onClick={deleteSelected}
          >
            Delete selected ({selected.size})
          </button>
        </div>
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-panel">
        {loading ? (
          <div className="admin-empty">Loading customers…</div>
        ) : rows.length === 0 ? (
          <div className="admin-empty">No customers yet.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.fullName}`}
                    />
                  </td>
                  <td>{row.fullName}</td>
                  <td>{row.email}</td>
                  <td>{row._count?.orders ?? 0}</td>
                  <td className="admin-muted">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn--ghost"
                      type="button"
                      disabled={busy}
                      onClick={() => deleteOne(row.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
