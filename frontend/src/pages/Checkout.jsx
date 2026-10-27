import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthButtons } from '../components/AuthButtons'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { useCart } from '../lib/cart'
import { guestContactLabel, readGuestContact, writeGuestContact } from '../lib/guest'
import { getLocation } from '../lib/location'

function makeDemoOrderId() {
  return `DEMO-${Date.now().toString(36).toUpperCase()}`
}

export default function Checkout() {
  const { lines, itemTotal, count, changeQty, clear } = useCart()
  const [instr, setInstr] = useState('door')
  const [note, setNote] = useState('')
  const [contact, setContact] = useState(() =>
    typeof window === 'undefined' ? { name: '', phone: '' } : readGuestContact(),
  )
  const [editingContact, setEditingContact] = useState(false)
  const [draftName, setDraftName] = useState(contact.name)
  const [draftPhone, setDraftPhone] = useState(contact.phone)
  const [contactError, setContactError] = useState('')
  const [placed, setPlaced] = useState(null)

  const placeLabel = getLocation().label
  const platform = 5
  const delivery = itemTotal >= 199 ? 0 : 40
  const grand = itemTotal + platform + delivery
  const shortPlace = placeLabel.split(',').slice(0, 2).join(',').trim() || placeLabel

  function openEditContact() {
    setDraftName(contact.name)
    setDraftPhone(contact.phone)
    setContactError('')
    setEditingContact(true)
  }

  function saveContact() {
    const name = draftName.trim()
    const phone = draftPhone.trim()
    if (!name || !phone) {
      setContactError('Name and phone are required.')
      return
    }
    const next = writeGuestContact({ name, phone })
    setContact(next)
    setEditingContact(false)
    setContactError('')
  }

  function placeDemoOrder() {
    if (!lines.length) return
    const name = contact.name.trim()
    const phone = contact.phone.trim()
    if (!name || !phone) {
      setContactError('Add your name and phone before placing the order.')
      setEditingContact(true)
      setDraftName(name)
      setDraftPhone(phone)
      return
    }
    const order = {
      id: makeDemoOrderId(),
      grand,
      count,
      placeLabel,
      contact: { name, phone },
      instr,
      note: note.trim(),
    }
    clear()
    setPlaced(order)
  }

  if (placed) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <div className="only-desktop">
          <header className="web-header">
            <Logo />
            <div className="web-header__right">
              <AuthButtons />
            </div>
          </header>
          <main className="container" style={{ maxWidth: 560, padding: '48px 24px' }}>
            <div className="cart-box dck-card" style={{ textAlign: 'center', padding: 32 }}>
              <Icon name="bag" size={40} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '16px 0 8px' }}>
                Order placed (demo)
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
                No payment was taken. This is a test confirmation only.
              </p>
              <p>
                <strong>Order ID:</strong> {placed.id}
              </p>
              <p style={{ marginTop: 8 }}>
                <strong>Total:</strong> ₹{placed.grand} · {placed.count} item
                {placed.count === 1 ? '' : 's'}
              </p>
              <p style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
                Deliver to {placed.placeLabel}
              </p>
              <p style={{ marginTop: 4, color: 'var(--color-text-muted)' }}>
                {placed.contact.name} · {placed.contact.phone}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
                <Link className="btn btn--primary" to="/discovery">
                  Back to restaurants
                </Link>
                <Link className="btn btn--outline" to="/">
                  Home
                </Link>
              </div>
            </div>
          </main>
        </div>

        <div className="only-mobile m-page">
          <header className="m-header">
            <Link className="m-icon-btn" to="/" aria-label="Home">
              <Icon name="back" size={22} />
            </Link>
            <strong>Order confirmed</strong>
            <span style={{ width: 44 }} />
          </header>
          <div className="m-content" style={{ padding: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
              Order placed (demo)
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
              No payment was taken.
            </p>
            <p>
              <strong>{placed.id}</strong>
            </p>
            <p style={{ marginTop: 8 }}>₹{placed.grand}</p>
            <Link className="btn btn--primary btn--block" to="/discovery" style={{ marginTop: 24 }}>
              Back to restaurants
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      <div className="only-desktop">
        <div className="promo-bar">
          <Icon name="gift" size={18} />
          Welcome treat! Get ₹50 off your first order.
        </div>

        <header className="web-header">
          <Logo />
          <div className="web-header__center">
            <button className="location-pill" type="button" title={placeLabel}>
              <span className="pin">
                <Icon name="pin" size={16} />
              </span>
              <span className="location-pill__label">{shortPlace}</span>
              <Icon name="chevronDown" size={14} />
            </button>
            <label className="field" style={{ flex: 1, minHeight: 44 }}>
              <span className="field__icon">
                <Icon name="search" size={18} />
              </span>
              <input type="search" placeholder="Search for restaurants, cuisines or dishes..." aria-label="Search" />
            </label>
          </div>
          <div className="web-header__right">
            <AuthButtons />
            <Link className="cart-btn" to="/checkout" aria-label="Cart">
              <Icon name="cart" size={20} />
              <span className="cart-btn__badge">{count}</span>
            </Link>
          </div>
        </header>

        <main className="container dck">
          <nav className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/discovery">Restaurants</Link> / Checkout
          </nav>

          <div className="dck-eta">
            <div className="dck-eta__from">
              <div className="dck-eta__avatar">
                <span className="dck-eta__badge">
                  <Icon name="store" size={14} />
                </span>
              </div>
              <div>
                <strong>{count ? `${count} item${count === 1 ? '' : 's'} in cart` : 'Your cart'}</strong>
                <span>From restaurants near you</span>
              </div>
            </div>
            <div className="dck-eta__mid">
              <div className="dck-eta__route">
                <span className="dck-eta__dash" />
                <Icon name="bike" size={20} />
                <span className="dck-eta__dash" />
              </div>
              <strong className="dck-eta__time">25 – 35 min</strong>
              <span className="dck-eta__hint">Estimated arrival · After restaurant confirms</span>
            </div>
            <div className="dck-eta__to">
              <div className="dck-eta__home">
                <Icon name="home" size={18} />
              </div>
              <div>
                <strong>Deliver to</strong>
                <span title={placeLabel}>{shortPlace}</span>
              </div>
            </div>
          </div>

          <div className="dck-layout">
            <div className="dck-main">
              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Delivery address</h3>
                <div className="dck-addr">
                  <span className="tag-home">Saved</span>
                  <p title={placeLabel}>{placeLabel}</p>
                  <Link className="ck-link" to="/discovery">
                    Change
                  </Link>
                </div>
                <div className="dck-contact">
                  {editingContact ? (
                    <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                      <label className="field" style={{ minHeight: 40 }}>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Your name"
                          aria-label="Your name"
                        />
                      </label>
                      <label className="field" style={{ minHeight: 40 }}>
                        <input
                          type="tel"
                          value={draftPhone}
                          onChange={(e) => setDraftPhone(e.target.value)}
                          placeholder="Phone number"
                          aria-label="Phone number"
                        />
                      </label>
                      {contactError ? (
                        <p style={{ color: 'var(--color-danger, #c00)', fontSize: 13 }}>{contactError}</p>
                      ) : null}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" className="ck-link" onClick={saveContact}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="ck-link"
                          onClick={() => {
                            setEditingContact(false)
                            setContactError('')
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="addr-contact__who">
                        <Icon name="phoneCall" size={16} /> {guestContactLabel(contact)}
                      </span>
                      <button type="button" className="ck-link" onClick={openEditContact}>
                        Edit
                      </button>
                    </>
                  )}
                </div>
                {!editingContact && contactError ? (
                  <p style={{ color: 'var(--color-danger, #c00)', fontSize: 13, marginTop: 8 }}>{contactError}</p>
                ) : null}
              </section>

              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Delivery instructions</h3>
                <div className="instr-grid dck-instr">
                  <button type="button" className={`instr-btn ${instr === 'door' ? 'is-active' : ''}`} onClick={() => setInstr('door')}>
                    <Icon name="door" size={16} /> Leave at door
                  </button>
                  <button type="button" className={`instr-btn ${instr === 'call' ? 'is-active' : ''}`} onClick={() => setInstr('call')}>
                    <Icon name="phoneCall" size={16} /> Call on arrival
                  </button>
                  <button type="button" className={`instr-btn ${instr === 'hand' ? 'is-active' : ''}`} onClick={() => setInstr('hand')}>
                    <Icon name="user" size={16} /> Hand it to me
                  </button>
                </div>
                <label className="note-field">
                  <span className="note-field__icon">
                    <Icon name="pin" size={16} />
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add landmark / delivery note (optional)"
                    aria-label="Delivery note"
                  />
                </label>
              </section>

              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Offers &amp; coupons</h3>
                <label className="offer-box">
                  <input type="radio" name="offer-d" className="offer-box__radio" aria-label="Use TATA50" />
                  <div className="offer-box__body">
                    <strong className="offer-box__title">
                      Use <span className="offer-box__code">TATA50</span> · Save ₹50
                    </strong>
                    <span className="offer-box__sub">Demo offer · not applied to total yet</span>
                  </div>
                  <span className="offer-box__tag">Available offer</span>
                </label>
              </section>

              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Choose payment method</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  Demo mode — no real charge.
                </p>
                <div className="pay-list">
                  <label className="pay-row">
                    <input type="radio" name="pay-d" defaultChecked />
                    <span className="pay-row__icon">
                      <Icon name="upi" size={22} />
                    </span>
                    <span className="pay-row__text">
                      <strong>UPI</strong>
                      <em>Pay using Google Pay, PhonePe, Paytm or any UPI app</em>
                    </span>
                  </label>
                  <label className="pay-row">
                    <input type="radio" name="pay-d" />
                    <span className="pay-row__icon">
                      <Icon name="creditCard" size={20} />
                    </span>
                    <span className="pay-row__text">
                      <strong>Credit / Debit Card</strong>
                      <em>Visa, Mastercard, RuPay and more</em>
                    </span>
                  </label>
                  <label className="pay-row">
                    <input type="radio" name="pay-d" />
                    <span className="pay-row__icon">
                      <Icon name="wallet" size={20} />
                    </span>
                    <span className="pay-row__text">
                      <strong>Wallets</strong>
                      <em>Paytm, Amazon Pay and more</em>
                    </span>
                  </label>
                </div>
              </section>
            </div>

            <aside className="dck-side">
              <div className="cart-box dck-card">
                <h3 className="dck-card__title">Order summary</h3>
                {!lines.length ? (
                  <p style={{ color: 'var(--color-text-muted)' }}>Your cart is empty.</p>
                ) : null}
                {lines.map((l) => (
                  <div className="cart-line" key={l.lineKey || l.id}>
                    <div className="cart-line__img">
                      <img src={l.img} alt="" />
                    </div>
                    <div className="cart-line__main">
                      <div className="cart-line__name">
                        {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                        <span>{l.name}</span>
                      </div>
                      {l.customisation?.length ? (
                        <p className="cart-line__custom">
                          {l.customisation.map((c) => c.choiceName).join(', ')}
                        </p>
                      ) : null}
                      <div className="cart-line__row">
                        <div className="qty qty--sheet">
                          <button type="button" onClick={() => changeQty(l.lineKey || l.id, -1)}>
                            −
                          </button>
                          <span>{l.qty}</span>
                          <button type="button" onClick={() => changeQty(l.lineKey || l.id, 1)}>
                            +
                          </button>
                        </div>
                        <strong className="cart-line__sum">₹{l.price * l.qty}</strong>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bill-rows" style={{ marginTop: 12 }}>
                  <div className="row">
                    <span>Item total</span>
                    <span>₹{itemTotal}</span>
                  </div>
                  <div className="row">
                    <span>Delivery fee</span>
                    <span>{delivery === 0 ? <span className="row--free">FREE</span> : `₹${delivery}`}</span>
                  </div>
                  <div className="row">
                    <span>Platform fee</span>
                    <span>₹{platform}</span>
                  </div>
                </div>
                <div className="grand-bar">
                  <span>To pay</span>
                  <span>₹{grand}</span>
                </div>
                <button
                  className="btn btn--primary btn--block btn--lg"
                  type="button"
                  disabled={!lines.length}
                  onClick={placeDemoOrder}
                >
                  Place order · ₹{grand}
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <div className="only-mobile m-page m-page--checkout">
        <header className="m-header">
          <Link className="m-icon-btn" to="/restaurant" aria-label="Back">
            <Icon name="back" size={22} />
          </Link>
          <strong>Checkout</strong>
          <span style={{ width: 44 }} />
        </header>

        <div className="m-content" style={{ paddingBottom: 120 }}>
          <section className="cart-box" style={{ margin: 16 }}>
            <h3>Contact</h3>
            {editingContact ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  style={{ padding: 10, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <input
                  type="tel"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  placeholder="Phone number"
                  aria-label="Phone number"
                  style={{ padding: 10, borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                {contactError ? (
                  <p style={{ color: 'var(--color-danger, #c00)', fontSize: 13 }}>{contactError}</p>
                ) : null}
                <button type="button" className="btn btn--primary" onClick={saveContact}>
                  Save contact
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>{guestContactLabel(contact)}</span>
                <button type="button" className="ck-link" onClick={openEditContact}>
                  Edit
                </button>
              </div>
            )}
          </section>

          <section className="cart-box" style={{ margin: 16 }}>
            <h3>Your items</h3>
            {lines.map((l) => (
              <div className="cart-line" key={l.lineKey || l.id}>
                <div className="cart-line__img">
                  <img src={l.img} alt="" />
                </div>
                <div className="cart-line__main">
                  <div className="cart-line__name">
                    {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                    <span>{l.name}</span>
                  </div>
                  {l.customisation?.length ? (
                    <p className="cart-line__custom">
                      {l.customisation.map((c) => c.choiceName).join(', ')}
                    </p>
                  ) : null}
                  <div className="cart-line__row">
                    <div className="qty qty--sheet">
                      <button type="button" onClick={() => changeQty(l.lineKey || l.id, -1)}>
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => changeQty(l.lineKey || l.id, 1)}>
                        +
                      </button>
                    </div>
                    <strong className="cart-line__sum">₹{l.price * l.qty}</strong>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="cart-box" style={{ margin: 16 }}>
            <h3>Payment</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>Demo — no real charge</p>
            <label className="pay-row">
              <input type="radio" name="pay-m" defaultChecked />
              <span className="pay-row__icon">
                <Icon name="upi" size={22} />
              </span>
              <span className="pay-row__text">
                <strong>UPI</strong>
                <em>GPay / PhonePe / Paytm</em>
              </span>
            </label>
            <label className="pay-row">
              <input type="radio" name="pay-m" />
              <span className="pay-row__icon">
                <Icon name="creditCard" size={20} />
              </span>
              <span className="pay-row__text">
                <strong>Card</strong>
                <em>Credit or debit</em>
              </span>
            </label>
          </section>

          <div className="bill-rows" style={{ margin: 16 }}>
            <div className="row">
              <span>Item total</span>
              <span>₹{itemTotal}</span>
            </div>
            <div className="row">
              <span>Delivery</span>
              <span>{delivery === 0 ? <span className="row--free">FREE</span> : `₹${delivery}`}</span>
            </div>
            <div className="row">
              <span>Platform fee</span>
              <span>₹{platform}</span>
            </div>
          </div>
          <div className="grand-bar" style={{ margin: 16 }}>
            <span>To pay</span>
            <span>₹{grand}</span>
          </div>
        </div>

        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 16, background: '#fff', borderTop: '1px solid var(--color-border)' }}>
          <button
            className="btn btn--primary btn--block btn--lg"
            type="button"
            disabled={!lines.length}
            onClick={placeDemoOrder}
          >
            Place order · ₹{grand}
          </button>
        </div>
      </div>
    </div>
  )
}
