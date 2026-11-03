import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  adminBulkDeleteOrders,
  adminDeleteOrder,
  adminListOrders,
} from '../lib/api'

function OrderRow({ row, open, selected, busy, onToggle, onExpand, onDelete }) {
  return (
    <Fragment>
      <tr>
        <td>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select order ${row.id}`}
          />
        </td>
        <td>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onExpand}>
            {row.id.slice(0, 8)}…
          </button>
        </td>
        <td>
          <div>{row.contact?.name || '—'}</div>
          <div className="admin-muted">
            {row.contact?.phone}
            {row.contact?.email ? ` · ${row.contact.email}` : ''}
          </div>
          {row.customer ? (
            <div className="admin-muted">Account: {row.customer.email}</div>
          ) : null}
        </td>
        <td>{row.itemCount ?? row.count ?? row.items?.length ?? 0}</td>
        <td>₹{row.grand}</td>
        <td className="admin-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </td>
        <td>
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            disabled={busy}
            onClick={onDelete}
          >
            Delete
          </button>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={7}>
            <div className="admin-detail">
              <dl className="admin-detail__grid">
                <div>
                  <dt>Place</dt>
                  <dd>{row.placeLabel || '—'}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{row.paymentMethod || '—'}</dd>
                </div>
                <div>
                  <dt>Note</dt>
                  <dd>{row.note || '—'}</dd>
                </div>
              </dl>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Restaurant</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {(row.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="admin-muted">{item.restaurantName || '—'}</td>
                      <td>{item.qty}</td>
                      <td>₹{item.unitPrice}</td>
                      <td>₹{item.unitPrice * item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  )
}

export default function AdminOrders() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminListOrders()
      setRows(Array.isArray(data) ? data : [])
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
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
    if (!window.confirm('Delete this order?')) return
    setBusy(true)
    setError('')
    try {
      await adminDeleteOrder(id)
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
    if (!window.confirm(`Delete ${ids.length} order(s)?`)) return
    setBusy(true)
    setError('')
    try {
      await adminBulkDeleteOrders(ids)
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
        <h1>Orders</h1>
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
          <div className="admin-empty">Loading orders…</div>
        ) : rows.length === 0 ? (
          <div className="admin-empty">No orders yet.</div>
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
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Placed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = expanded === row.id
                return (
                  <OrderRow
                    key={row.id}
                    row={row}
                    open={open}
                    selected={selected.has(row.id)}
                    busy={busy}
                    onToggle={() => toggle(row.id)}
                    onExpand={() => setExpanded(open ? null : row.id)}
                    onDelete={() => deleteOne(row.id)}
                  />
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
