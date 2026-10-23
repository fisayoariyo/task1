import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { CATEGORIES } from '../lib/data'

/** Cut-out cuisine tiles (soft pink circle assets) — matches mobile landing mock */
const mobileCats = [
  { name: 'Biryani', img: '/assets/cats/biryani-ss.png?v=12' },
  { name: 'Pizza', img: '/assets/cats/pizza-ss.png?v=12' },
  { name: 'Burgers', img: '/assets/cats/burgers-ss.png?v=12' },
  { name: 'North Indian', img: '/assets/cats/north-ss.png?v=12' },
  { name: 'South Indian', img: '/assets/cats/south-ss.png?v=12' },
  { name: 'Chinese', img: '/assets/cats/chinese-ss.png?v=12' },
  { name: 'Rolls & Wraps', img: '/assets/cats/rolls-ss.png?v=12' },
  { name: 'Desserts', img: '/assets/cats/desserts-ss.png?v=12' },
]

export default function Landing() {
  return (
    <>
      <div className="only-desktop">
        <div className="promo-bar promo-bar--landing">
          <div className="promo-bar__main">
            <Icon name="gift" size={18} />
            Welcome treat! Get ₹50 off your first order.
          </div>
          <div className="promo-bar__terms">On eligible orders up to ₹500 • Terms apply</div>
        </div>

        <header className="web-header web-header--landing">
          <Logo />
          <div className="web-header__right">
            <button className="lang-select" type="button">
              <Icon name="globe" size={16} /> India <Icon name="chevronDown" size={16} />
            </button>
            <a className="btn btn--outline" href="#">
              Log in
            </a>
            <a className="btn btn--primary" href="#">
              Sign up
            </a>
          </div>
        </header>

        <div className="hero-band">
          <img className="hero-band__bg" src="/assets/hero-bg.jpg" alt="" />
          <section className="hero">
            <div className="hero__copy">
              <p className="hero__eyebrow">FOOD DELIVERY NEAR ME</p>
              <h1 className="hero__title">
                Food Delivery Near Me
                <br />
                <span className="accent">
                  Order food online,
                  <br />
                  made easy.
                </span>
              </h1>
              <p className="hero__sub">Enter your delivery address to find food options that deliver to your area.</p>
              <div className="hero__search">
                <span className="field__icon">
                  <Icon name="pin" size={18} />
                </span>
                <input type="text" placeholder="Enter your house no., street, area or PIN code" aria-label="Delivery address" />
                <Link className="btn btn--primary" to="/discovery">
                  Find food →
                </Link>
              </div>
              <button className="hero__locate" type="button">
                <Icon name="locate" size={16} /> Use my current location
              </button>
              <p className="hero__hint">We’ll show restaurants only after you enter an address.</p>
            </div>
          </section>
        </div>

        <div className="value-bar">
          <div className="value-bar__inner">
            <div className="value-item">
              <div className="value-item__icon">
                <Icon name="pin" size={20} />
              </div>
              <div>
                <strong>Local options</strong>
                <p>Find restaurants that deliver to your address</p>
              </div>
            </div>
            <div className="value-item">
              <div className="value-item__icon">
                <Icon name="phone" size={20} />
              </div>
              <div>
                <strong>Easy ordering</strong>
                <p>Simple and secure online ordering</p>
              </div>
            </div>
            <div className="value-item">
              <div className="value-item__icon">
                <Icon name="percent" size={20} />
              </div>
              <div>
                <strong>Offers with clear terms</strong>
                <p>Great food with exciting offers</p>
              </div>
            </div>
          </div>
        </div>

        <section className="section favourites">
          <div className="container">
            <div className="favourites__head">
              <div>
                <h2 className="section__title">India’s Food Favourites</h2>
                <p className="section__sub">Explore popular cuisines and dishes loved across India.</p>
              </div>
              <aside className="favourites__tip">
                <span className="favourites__tip-icon">
                  <Icon name="bulb" size={18} />
                </span>
                <p>
                  <strong>Just browsing for inspiration?</strong> Enter your address to check what’s available in your area.
                </p>
              </aside>
            </div>
            <div className="cuisine-grid">
              {CATEGORIES.map((c) => (
                <Link key={c.name} className="cuisine-card" to="/discovery">
                  <div className="cuisine-card__img">
                    <img src={c.img} alt={c.name} loading="lazy" />
                  </div>
                  <span className="cuisine-card__label">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--promo">
          <div className="container">
            <div className="promo-banner">
              <img className="promo-banner__gift" src="/assets/promo-gift-cut.png" alt="" />
              <div className="promo-banner__content">
                <div className="promo-banner__copy">
                  <div className="promo-banner__eyebrow">NEW HERE?</div>
                  <div className="promo-banner__title">
                    Get <span className="accent">₹50 off</span> your first order.
                  </div>
                  <p className="promo-banner__sub">For eligible orders up to ₹500. See offer terms before ordering.</p>
                </div>
                <div className="promo-banner__cta">
                  <Link className="btn btn--primary btn--lg" to="/discovery">
                    Enter your address →
                  </Link>
                  <p className="promo-banner__terms">Terms apply</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section how-works">
          <div className="container">
            <h2 className="section__title">How nomnom works</h2>
            <p className="section__sub">Get your favourite food in a few simple steps.</p>
            <div className="steps">
              <article className="step">
                <div className="step__top">
                  <span className="step__badge">1</span>
                  <span className="step__icon">
                    <Icon name="pin" size={18} />
                  </span>
                </div>
                <strong>Add your address</strong>
                <p>Enter your house no., street, area or PIN code.</p>
              </article>
              <div className="steps__arrow" aria-hidden="true" />
              <article className="step">
                <div className="step__top">
                  <span className="step__badge">2</span>
                  <span className="step__icon">
                    <Icon name="store" size={18} />
                  </span>
                </div>
                <strong>Check local options</strong>
                <p>We’ll show restaurants and cuisines that deliver to your area.</p>
              </article>
              <div className="steps__arrow" aria-hidden="true" />
              <article className="step">
                <div className="step__top">
                  <span className="step__badge">3</span>
                  <span className="step__icon">
                    <Icon name="bag" size={18} />
                  </span>
                </div>
                <strong>Choose and order</strong>
                <p>Add items to cart and place your order securely.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--meals">
          <div className="container feature-split">
            <div className="feature-split__media" aria-hidden="true">
              <img src="/assets/meals-feast.jpg" alt="" />
            </div>
            <div className="feature-split__copy">
              <p className="feature-split__eyebrow">GOOD FOOD, GREAT MOMENTS</p>
              <h2 className="section__title">Your favourite meals, delivered to you.</h2>
              <p className="feature-split__lead">Enter your address to see relevant restaurants, cuisines and offers near you.</p>
              <ul className="feature-list">
                <li>
                  <div className="feature-list__icon">
                    <Icon name="pin" size={18} />
                  </div>
                  <div>
                    <strong>Discover local options</strong>
                    <p>See restaurants that deliver to your area.</p>
                  </div>
                </li>
                <li>
                  <div className="feature-list__icon">
                    <Icon name="bag" size={18} />
                  </div>
                  <div>
                    <strong>Wide variety</strong>
                    <p>Biryani, pizza, North Indian, South Indian, burgers and more.</p>
                  </div>
                </li>
                <li>
                  <div className="feature-list__icon">
                    <Icon name="heart" size={18} />
                  </div>
                  <div>
                    <strong>Easy and secure ordering</strong>
                    <p>Multiple payment options for a smooth experience.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--app">
          <div className="container">
            <div className="app-teaser">
              <img className="app-teaser__phone" src="/assets/app-phone.png" alt="" />
              <div className="app-teaser__copy">
                <span className="app-teaser__icon">
                  <Icon name="phone" size={20} />
                </span>
                <div>
                  <strong>The nomnom app</strong>
                  <p>Order on the go. Same great food, coming soon.</p>
                </div>
              </div>
              <button className="btn app-teaser__btn" type="button">
                <Icon name="pin" size={16} /> App coming soon
              </button>
            </div>
          </div>
        </section>

        <section className="section section--partner">
          <div className="container">
            <div className="partner-cta">
              <div className="partner-cta__inner">
                <div className="partner-cta__copy">
                  <span className="partner-cta__icon">
                    <Icon name="store" size={22} />
                  </span>
                  <div>
                    <h2>Restaurant or delivery partner?</h2>
                    <p>Grow your business with nomnom.</p>
                  </div>
                </div>
                <a className="btn btn--partner" href="#">
                  Learn about partnering with us <Icon name="chevron" size={16} />
                </a>
              </div>
              <div className="partner-cta__photo" aria-hidden="true">
                <img src="/assets/partner-wok.jpg" alt="" />
              </div>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo className="logo--inverse" />
              <p className="site-footer__tag">Good food. Made easy.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <a href="#">Cuisines</a>
              <a href="#">Offers</a>
              <a href="#">Cities</a>
            </div>
            <div>
              <h4>Help &amp; Support</h4>
              <a href="#">Order help</a>
              <a href="#">Payments</a>
              <a href="#">Contact us</a>
              <a href="#">FAQs</a>
            </div>
            <div>
              <h4>About</h4>
              <a href="#">Our story</a>
              <a href="#">Careers</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="site-footer__bottom">
            <span>© 2026 nomnom. All rights reserved.</span>
            <button className="footer-locale" type="button">
              <Icon name="globe" size={16} /> India (EN) <Icon name="chevronDown" size={14} />
            </button>
          </div>
        </footer>
      </div>

      <div className="only-mobile m-page m-page--landing m-page--no-tab">
        <header className="m-header">
          <Logo className="logo--sm" />
          <button className="m-icon-btn" type="button" aria-label="Account">
            <Icon name="user" size={22} />
          </button>
        </header>
        <div className="m-content">
          <div className="m-welcome">
            <img className="m-welcome__art" src="/assets/welcome-gift.png" alt="" width="104" height="104" />
            <div className="m-welcome__copy">
              <div className="m-welcome__eyebrow">WELCOME TREAT!</div>
              <div className="m-welcome__title">
                Get <span className="m-welcome__accent">₹50 off</span>
                <br />
                on your first order
              </div>
              <p className="m-welcome__sub">Order anything up to ₹500. T&amp;C apply.</p>
            </div>
          </div>
          <div className="m-address-card">
            <div className="m-loc-label">
              <Icon name="pin" size={18} /> Enter your delivery address
            </div>
            <div className="m-address-row">
              <label className="field m-address-field">
                <span className="field__icon">
                  <Icon name="search" size={18} />
                </span>
                <input type="text" placeholder="House no., street, area or PIN code" aria-label="Delivery address" />
                <span className="m-address-field__divider" aria-hidden="true" />
                <button type="button" className="m-icon-btn m-locate-btn" aria-label="Use current location">
                  <Icon name="locate" size={20} />
                </button>
              </label>
              <Link className="btn btn--primary m-find-btn" to="/discovery">
                Find food →
              </Link>
            </div>
          </div>
          <div className="m-section-head">
            <h2>Popular in your area</h2>
            <Link to="/discovery">See all →</Link>
          </div>
          <div className="m-cat-grid">
            {mobileCats.map((c) => (
              <Link key={c.name} className="m-cat" to="/discovery">
                <div className="m-cat__img">
                  <img src={c.img} alt={c.name} loading="lazy" />
                </div>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="m-section-head">
            <h2>Why choose nomnom</h2>
          </div>
          <div className="m-why">
            <div>
              <div className="m-why__icon">
                <Icon name="bolt" size={22} />
              </div>
              <strong>Wide choice</strong>
              <p>Top restaurants near you</p>
            </div>
            <div>
              <div className="m-why__icon">
                <Icon name="bike" size={22} />
              </div>
              <strong>Easy ordering</strong>
              <p>Simple and secure</p>
            </div>
            <div>
              <div className="m-why__icon">
                <Icon name="percent" size={22} />
              </div>
              <strong>Great offers</strong>
              <p>Save more every day</p>
            </div>
          </div>
          <div className="m-app-card">
            <div className="m-app-card__phone" aria-hidden="true">
              <img src="/assets/app-phone.png" alt="" width="140" height="160" />
            </div>
            <div className="m-app-card__copy">
              <strong>
                Get the <span className="m-app-card__brand">nomnom</span> app
              </strong>
              <p>Faster ordering, exclusive offers and more.</p>
            </div>
          </div>
        </div>
        <footer className="m-footer-mini">
          © 2026 nomnom. All rights reserved. <a href="#">Privacy</a> | <a href="#">Terms</a> | <a href="#">Contact</a>
        </footer>
      </div>
    </>
  )
}
