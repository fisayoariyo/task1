import { IMG } from '../lib/data'

/** Noon-like menu row: text left, image right, pink +. */
export function MenuItemRow({ dish: d, onAdd, id }) {
  return (
    <article className="noon-menu-item" id={id}>
      <div className="noon-menu-item__text">
        <div className="noon-menu-item__name">
          {d.veg ? <span className="veg-dot" aria-label="Veg" /> : <span className="nonveg-dot" aria-label="Non-veg" />}{' '}
          {d.name}
          {d.bestseller ? (
            <span className="badge" style={{ fontSize: '.625rem', marginLeft: 6 }}>
              Bestseller
            </span>
          ) : null}
        </div>
        {d.desc ? <p className="noon-menu-item__desc">{d.desc}</p> : null}
        <div className="noon-menu-item__price">
          ₹{d.price}
          {d.was && d.was > d.price ? (
            <span style={{ marginLeft: 8, color: 'var(--color-text-muted)', textDecoration: 'line-through', fontWeight: 500 }}>
              ₹{d.was}
            </span>
          ) : null}
        </div>
      </div>
      <div className="noon-menu-item__media">
        <img
          src={d.img}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = IMG.chicken
          }}
        />
        <button type="button" className="noon-menu-item__add" aria-label={`Add ${d.name}`} onClick={() => onAdd(d)}>
          +
        </button>
      </div>
    </article>
  )
}
