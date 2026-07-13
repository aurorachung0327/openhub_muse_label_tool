// ============================================================================
// Per-frame labeling logic — the single source of truth for ALL labeling rules.
//
// A frame's `labeling` object has exactly this shape:
//   {
//     object: { [radarId]: boxId | null },   // radar track is a real object,
//                                             // mapped to a YOLO box id this
//                                             // frame (null if camera missed it)
//     noise:  [ radarId, ... ],              // noise points
//     pairs:  [ [radarIdA, radarIdB], ... ]  // mirror pairs, symmetric relation
//                                             // stored ONCE (not both directions)
//   }
//
// Every function here is PURE: takes a labeling object, returns a NEW one.
// Nothing mutates input. This is the only module allowed to construct the
// shape of `labeling`, so the rules can't drift out of sync across the app.
//
// Rules enforced here:
//   - object & noise are mutually exclusive (per radar id)
//   - noise cascades across a pair: marking one half noise marks the other half
//   - clearing noise on a paired point also clears it on its partner
//   - pairs are symmetric and stored once; unlinking removes the single entry
// ============================================================================

export function emptyLabeling() {
  return { object: {}, noise: [], pairs: [] }
}

// Normalizes a possibly-missing/partial labeling object into the full shape.
export function normalizeLabeling(l) {
  return {
    object: l?.object && typeof l.object === 'object' ? { ...l.object } : {},
    noise:  Array.isArray(l?.noise) ? [...l.noise] : [],
    pairs:  Array.isArray(l?.pairs) ? l.pairs.map(p => [...p]) : [],
  }
}

// ── queries ────────────────────────────────────────────────────────────────

export function isObject(l, radarId) {
  return Object.prototype.hasOwnProperty.call(l.object, radarId)
}
export function isNoise(l, radarId) {
  return l.noise.includes(radarId)
}
export function getPartner(l, radarId) {
  for (const [a, b] of l.pairs) {
    if (a === radarId) return b
    if (b === radarId) return a
  }
  return null
}
export function isPaired(l, radarId) {
  return getPartner(l, radarId) !== null
}
// Box id this radar object maps to this frame (null = object but no box).
export function getObjectBox(l, radarId) {
  return isObject(l, radarId) ? l.object[radarId] : undefined
}

// ── object ───────────────────────────────────────────────────────────────

// Toggle object on a radar id. Turning ON clears any noise on the SAME id
// (mutual exclusion). boxId is the YOLO box it maps to this frame (or null).
export function toggleObject(l, radarId, boxId = null) {
  const next = normalizeLabeling(l)
  if (isObject(next, radarId)) {
    delete next.object[radarId]
  } else {
    next.object[radarId] = boxId
    next.noise = next.noise.filter(id => id !== radarId)
  }
  return next
}

// Update which box an existing object maps to (without toggling object off).
export function setObjectBox(l, radarId, boxId) {
  const next = normalizeLabeling(l)
  if (isObject(next, radarId)) next.object[radarId] = boxId
  return next
}

// ── noise (with pair cascade) ───────────────────────────────────────────────

// Toggle noise on a radar id. Turning ON clears object on the same id, and
// cascades to its pair partner (the mirror point is noise too). Turning OFF
// also clears the partner's noise, keeping the pair consistent.
export function toggleNoise(l, radarId) {
  const next = normalizeLabeling(l)
  const partner = getPartner(next, radarId)
  const turningOn = !isNoise(next, radarId)

  const affected = partner !== null ? [radarId, partner] : [radarId]

  if (turningOn) {
    for (const id of affected) {
      if (!next.noise.includes(id)) next.noise.push(id)
      delete next.object[id]            // mutual exclusion
    }
  } else {
    next.noise = next.noise.filter(id => !affected.includes(id))
  }
  return next
}

// ── pairs ────────────────────────────────────────────────────────────────

// Link two radar ids as a mirror pair. Removes any pre-existing links on
// either side first (so no dangling one-sided pairs). If either point is
// already noise, the cascade rule means the newly-linked partner should
// also become noise — we apply that here to keep the invariant.
export function linkPair(l, idA, idB) {
  let next = unlinkPair(l, idA)
  next = unlinkPair(next, idB)
  next.pairs.push([idA, idB])
  // keep noise-cascade invariant: if one side is noise, both are
  const aNoise = isNoise(next, idA)
  const bNoise = isNoise(next, idB)
  if (aNoise || bNoise) {
    for (const id of [idA, idB]) {
      if (!next.noise.includes(id)) next.noise.push(id)
      delete next.object[id]
    }
  }
  return next
}

// Remove whatever pair a radar id belongs to (clears the single stored entry,
// so both sides are unlinked together). Does not touch object/noise.
export function unlinkPair(l, radarId) {
  const next = normalizeLabeling(l)
  next.pairs = next.pairs.filter(([a, b]) => a !== radarId && b !== radarId)
  return next
}

// ── clear everything for one radar id ──────────────────────────────────────

export function clearRadar(l, radarId) {
  let next = unlinkPair(l, radarId)
  delete next.object[radarId]
  next.noise = next.noise.filter(id => id !== radarId)
  return next
}
