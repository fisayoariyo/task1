import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { useCart } from '../lib/cart'

export default function Checkout() {
  const { lines, itemTotal, count, changeQty } = useCart()
  const [instr, setInstr] = useState('door')
  const platform = 5
  const delivery = itemTotal >= 199 ? 0 : 40
  const grand = itemTotal + platform + delivery

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
            <button className="location-pill" type="button">
              <span className="pin">
                <Icon name="pin" size={16} />
              </span>
              Koramangala, Bengaluru
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
            <a className="btn btn--outline" href="#">
              Log in
            </a>
            <a className="btn btn--primary" href="#">
              Sign up
            </a>
            <Link className="cart-btn" to="/checkout" aria-label="Cart">
              <Icon name="cart" size={20} />
              <span className="cart-btn__badge">{count}</span>
            </Link>
          </div>
        </header>

        <main className="container dck">
          <nav className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/discovery">Restaurants</Link> /{' '}
            <Link to="/restaurant">Royal Biryani House</Link> / Checkout
          </nav>

          <div className="dck-eta">
            <div className="dck-eta__from">
              <div className="dck-eta__avatar">
                <img src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80" alt="" />
                <span className="dck-eta__badge">
                  <Icon name="store" size={14} />
                </span>
              </div>
              <div>
                <strong>Royal Biryani House</strong>
                <span>Koramangala, Bengaluru</span>
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
                <strong>Deliver to Home</strong>
                <span>Koramangala, Bengaluru</span>
              </div>
            </div>
          </div>

          <div className="dck-layout">
            <div className="dck-main">
              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Delivery address</h3>
                <div className="dck-addr">
                  <span className="tag-home">Home</span>
                  <p>Flat 302, Lakeview Residency, 80 Feet Road, Koramangala, Bengaluru 560034</p>
                  <a className="ck-link" href="#">
                    Change
                  </a>
                </div>
                <div className="dck-contact">
                  <span className="addr-contact__who">
                    <Icon name="phoneCall" size={16} /> Adefisayomi · +91 90000 00000
                  </span>
                  <a className="ck-link" href="#">
                    Edit
                  </a>
                </div>
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
                  <input type="text" placeholder="Add landmark / delivery note (optional)" aria-label="Delivery note" />
                </label>
              </section>

              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Offers &amp; coupons</h3>
                <label className="offer-box">
                  <input type="radio" name="offer-d" className="offer-box__radio" aria-label="Use NOMNOM50" />
                  <div className="offer-box__body">
                    <strong className="offer-box__title">
                      Use <span className="offer-box__code">NOMNOM50</span> · Save ₹50
                    </strong>
                    <span className="offer-box__sub">Get ₹50 off on orders above ₹500</span>
                  </div>
                  <span className="offer-box__tag">Available offer</span>
                </label>
              </section>

              <section className="cart-box dck-card">
                <h3 className="dck-card__title">Choose payment method</h3>
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
                {lines.map((l) => (
                  <div className="cart-line" key={l.id}>
                    <div className="cart-line__img">
                      <img src={l.img} alt="" />
                    </div>
                    <div className="cart-line__main">
                      <div className="cart-line__name">
                        {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                        <span>{l.name}</span>
                      </div>
                      <div className="cart-line__row">
                        <div className="qty qty--sheet">
                          <button type="button" onClick={() => changeQty(l.id, -1)}>
                            −
                          </button>
                          <span>{l.qty}</span>
                          <button type="button" onClick={() => changeQty(l.id, 1)}>
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
                <button className="btn btn--primary btn--block btn--lg" type="button">
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
            <h3>Your items</h3>
            {lines.map((l) => (
              <div className="cart-line" key={l.id}>
                <div className="cart-line__img">
                  <img src={l.img} alt="" />
                </div>
                <div className="cart-line__main">
                  <div className="cart-line__name">
                    {l.veg ? <span className="veg-dot" /> : <span className="nonveg-dot" />}
                    <span>{l.name}</span>
                  </div>
                  <div className="cart-line__row">
                    <div className="qty qty--sheet">
                      <button type="button" onClick={() => changeQty(l.id, -1)}>
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => changeQty(l.id, 1)}>
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
          <button className="btn btn--primary btn--block btn--lg" type="button">
            Place order · ₹{grand}
          </button>
        </div>
      </div>
    </div>
  )
}
