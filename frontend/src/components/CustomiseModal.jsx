import { useEffect, useMemo, useState } from 'react'

const CHOICE_PREVIEW = 5

function sortIds(ids) {
  return [...ids].map(String).filter(Boolean).sort()
}

function matchPricingModel(dish, variationIds) {
  const models = dish?.pricingModels || []
  if (!models.length) return null
  const key = sortIds(variationIds).join(',')
  return (
    models.find((m) => sortIds(m.variationIds || []).join(',') === key) ||
    models[0] ||
    null
  )
}

function filterAddonGroups(addons, model) {
  const groups = addons || []
  if (!model?.addonIds?.length) return groups
  const allow = new Set(model.addonIds.map(String))
  return groups
    .map((g) => ({
      ...g,
      choices: (g.choices || []).filter((c) => allow.has(String(c.id))),
    }))
    .filter((g) => g.choices.length)
}

function defaultSelectionForGroup(g) {
  const defaults = (g.choices || []).filter((c) => c.isDefault).map((c) => c.id)
  if (g.max === 1) {
    return defaults[0] || (g.min > 0 ? g.choices?.[0]?.id : null) || null
  }
  return defaults.slice(0, g.max)
}

function groupSatisfied(g, value) {
  if (g.max === 1) {
    if (g.min > 0) return Boolean(value)
    return true
  }
  const picked = Array.isArray(value) ? value : []
  return picked.length >= (g.min || 0)
}

/**
 * Swiggy-style multi-layer customise:
 * 1) each variant group = its own sheet (Continue)
 * 2) then one “Customise as per your taste” sheet with valid addons
 *    (filtered by pricingModels.addonCombinations when present)
 */
export function CustomiseModal({ dish, open, onClose, onAdd }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [selected, setSelected] = useState({})
  const [expanded, setExpanded] = useState({})

  const variantGroups = useMemo(
    () => (dish?.variants || []).map((g) => ({ ...g, kind: 'variant' })),
    [dish],
  )

  const selectedVariationIds = useMemo(() => {
    const ids = []
    for (const g of variantGroups) {
      const v = selected[g.id]
      if (v) ids.push(v)
    }
    return ids
  }, [variantGroups, selected])

  const pricingModel = useMemo(
    () => matchPricingModel(dish, selectedVariationIds),
    [dish, selectedVariationIds],
  )

  const addonGroups = useMemo(() => {
    const filtered = filterAddonGroups(dish?.addons || [], pricingModel)
    return filtered.map((g) => ({ ...g, kind: 'addon' }))
  }, [dish, pricingModel])

  const steps = useMemo(() => {
    const list = variantGroups.map((g) => ({
      type: 'variant',
      title: g.name,
      groups: [g],
    }))
    if (addonGroups.length) {
      list.push({
        type: 'addons',
        title: 'Customise as per your taste',
        groups: addonGroups,
      })
    }
    if (!list.length && dish) {
      list.push({ type: 'addons', title: 'Customise as per your taste', groups: [] })
    }
    return list
  }, [variantGroups, addonGroups, dish])

  const step = steps[stepIndex] || steps[0]
  const isLast = stepIndex >= steps.length - 1

  useEffect(() => {
    if (!open || !dish) return
    const next = {}
    for (const g of [...(dish.variants || []), ...(dish.addons || [])]) {
      next[g.id] = defaultSelectionForGroup(g)
    }
    setSelected(next)
    setStepIndex(0)
    setExpanded({})
  }, [open, dish])

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') {
        if (stepIndex > 0) setStepIndex((i) => i - 1)
        else onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, stepIndex])

  const { unitPrice, selectionIds, customisation, stepOk, missing } = useMemo(() => {
    if (!dish) {
      return {
        unitPrice: 0,
        selectionIds: [],
        customisation: [],
        stepOk: false,
        missing: [],
      }
    }

    const miss = []
    for (const g of step?.groups || []) {
      if (!groupSatisfied(g, selected[g.id])) miss.push(g.name)
    }

    let base =
      pricingModel && pricingModel.price > 0
        ? Number(pricingModel.price)
        : Number(dish.price) || 0
    // If pricing model already encodes variant price, don't double-count variant deltas.
    const useModelPrice = Boolean(pricingModel && pricingModel.price > 0)

    let extra = 0
    const ids = []
    const lines = []

    for (const g of variantGroups) {
      const choiceId = selected[g.id]
      const choice = g.choices.find((c) => c.id === choiceId)
      if (!choice) continue
      ids.push(choice.id)
      if (!useModelPrice && choice.price) extra += Number(choice.price) || 0
      lines.push({
        groupName: g.name,
        choiceName: choice.name,
        price: useModelPrice ? 0 : choice.price || 0,
      })
    }

    for (const g of addonGroups) {
      if (g.max === 1) {
        const choiceId = selected[g.id]
        const choice = g.choices.find((c) => c.id === choiceId)
        if (!choice) continue
        ids.push(choice.id)
        extra += Number(choice.price) || 0
        lines.push({
          groupName: g.name,
          choiceName: choice.name,
          price: choice.price || 0,
        })
      } else {
        const picked = Array.isArray(selected[g.id]) ? selected[g.id] : []
        for (const choiceId of picked) {
          const choice = g.choices.find((c) => c.id === choiceId)
          if (!choice) continue
          ids.push(choice.id)
          extra += Number(choice.price) || 0
          lines.push({
            groupName: g.name,
            choiceName: choice.name,
            price: choice.price || 0,
          })
        }
      }
    }

    return {
      unitPrice: Math.round(base + extra),
      selectionIds: ids,
      customisation: lines,
      stepOk: miss.length === 0,
      missing: miss,
    }
  }, [dish, step, selected, variantGroups, addonGroups, pricingModel])

  if (!open || !dish) return null

  function pickRadio(groupId, choiceId) {
    setSelected((prev) => ({ ...prev, [groupId]: choiceId }))
  }

  function toggleMulti(group, choiceId) {
    setSelected((prev) => {
      const cur = Array.isArray(prev[group.id]) ? [...prev[group.id]] : []
      const idx = cur.indexOf(choiceId)
      if (idx >= 0) cur.splice(idx, 1)
      else {
        if (cur.length >= group.max) return prev
        cur.push(choiceId)
      }
      return { ...prev, [group.id]: cur }
    })
  }

  function goNext() {
    if (!stepOk) return
    if (!isLast) {
      setStepIndex((i) => i + 1)
      return
    }
    onAdd?.({
      id: dish.id,
      name: dish.name,
      img: dish.img,
      veg: dish.veg,
      unitPrice,
      selectionIds,
      customisation,
    })
    onClose?.()
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
    else onClose?.()
  }

  const layerLabel =
    steps.length > 1 ? `Step ${stepIndex + 1} of ${steps.length}` : null

  return (
    <div className="customise-overlay" role="presentation" onClick={onClose}>
      <div
        className="customise-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Customise ${dish.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="customise-sheet__head">
          <div>
            {step?.type === 'addons' ? (
              <>
                <p className="customise-sheet__eyebrow">
                  {dish.name} · ₹{Math.round(unitPrice)}
                </p>
                <h2 className="customise-sheet__title">{step.title}</h2>
              </>
            ) : (
              <>
                <h2 className="customise-sheet__title">{dish.name}</h2>
                <p className="customise-sheet__price">₹{Math.round(unitPrice)}</p>
                <p className="customise-sheet__sub" style={{ margin: '8px 0 0' }}>
                  {step?.title}
                </p>
              </>
            )}
            {layerLabel ? <p className="customise-sheet__layer">{layerLabel}</p> : null}
          </div>
          <button
            type="button"
            className="customise-sheet__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="customise-sheet__body">
          {(step?.groups || []).map((g) => {
            const multi = g.max > 1
            const optional = !(g.min > 0)
            const allChoices = g.choices || []
            const isExpanded = Boolean(expanded[g.id])
            const visible = isExpanded
              ? allChoices
              : allChoices.slice(0, CHOICE_PREVIEW)
            const hidden = Math.max(0, allChoices.length - visible.length)

            return (
              <section key={g.id} className="customise-group">
                <h3 className="customise-group__title">
                  {g.name}
                  {optional && !/\(optional\)/i.test(g.name) ? (
                    <span className="customise-group__opt"> (optional)</span>
                  ) : null}
                  {g.min > 0 ? (
                    <span className="customise-group__req">Required</span>
                  ) : null}
                </h3>
                <ul className="customise-group__list">
                  {visible.map((c) => {
                    const disabled = c.inStock === false
                    const checked = multi
                      ? (selected[g.id] || []).includes(c.id)
                      : selected[g.id] === c.id
                    return (
                      <li key={c.id}>
                        <label
                          className={`customise-choice ${disabled ? 'is-disabled' : ''} ${checked ? 'is-on' : ''}`}
                        >
                          <span className="customise-choice__left">
                            {c.isVeg === false ? (
                              <span className="nonveg-dot" aria-hidden="true" />
                            ) : (
                              <span className="veg-dot" aria-hidden="true" />
                            )}
                            <span className="customise-choice__name">{c.name}</span>
                          </span>
                          <span className="customise-choice__right">
                            {c.price > 0 ? (
                              <span className="customise-choice__price">
                                + ₹{Math.round(c.price)}
                              </span>
                            ) : null}
                            <input
                              type={multi ? 'checkbox' : 'radio'}
                              name={`g-${g.id}`}
                              checked={checked}
                              disabled={disabled}
                              onChange={() =>
                                multi ? toggleMulti(g, c.id) : pickRadio(g.id, c.id)
                              }
                            />
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
                {hidden > 0 ? (
                  <button
                    type="button"
                    className="customise-group__more"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [g.id]: true }))
                    }
                  >
                    + {hidden} more
                  </button>
                ) : null}
              </section>
            )
          })}
        </div>

        <footer className="customise-sheet__foot">
          {!stepOk && missing.length ? (
            <p className="customise-sheet__hint">Select: {missing[0]}</p>
          ) : null}
          <div className="customise-sheet__bar">
            {stepIndex > 0 ? (
              <button type="button" className="customise-sheet__back" onClick={goBack}>
                Back
              </button>
            ) : (
              <div className="customise-sheet__total">
                <span>₹{unitPrice.toFixed(2)}</span>
              </div>
            )}
            {stepIndex > 0 ? (
              <div className="customise-sheet__total customise-sheet__total--mid">
                <span>₹{unitPrice.toFixed(2)}</span>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn--primary customise-sheet__add"
              disabled={!stepOk}
              onClick={goNext}
            >
              {isLast ? 'Add Item to Cart' : 'Continue'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
