// Pure helpers for mutating the clusters array based on labeling rules.
// All functions return a NEW array (never mutate the input).
//
// Data model: each cluster now carries three independent boolean flags
// instead of a single label string, because a point can be BOTH
// "pair" and "noise" at the same time (a ghost point that turned out
// to be noise keeps its pair link, but is also flagged as noise).
//
//   cluster.object  : confirmed real object
//   cluster.pair    : ghost/mirror point, linked via pair_id
//   cluster.noise   : noise
//
// Hard rule: object and noise are mutually exclusive — setting one
// always clears the other. Pair + noise CAN coexist (cascade case).

export function unlinkPairAt(arr, idx) {
  const c = arr[idx]
  if (!c || c.pair_id == null) return arr
  const partnerIdx = arr.findIndex(x => x.track_id === c.pair_id)
  const next = arr.map(x => ({ ...x }))
  next[idx] = { ...next[idx], pair_id: null, pair: false }
  if (partnerIdx >= 0) {
    next[partnerIdx] = { ...next[partnerIdx], pair_id: null, pair: false }
  }
  return next
}

export function labelAsObject(arr, idx) {
  const next = unlinkPairAt(arr, idx)
  return next.map((c, i) =>
    i === idx ? { ...c, object: true, noise: false, pair: false } : c
  )
}

// Links two clusters as a ghost pair. Breaks any pre-existing pair link
// on either side first. Marking something as "pair" clears "object"
// (a ghost point can't also be a confirmed object), but does NOT touch
// an existing "noise" flag — if it was already noise, it stays noise.
export function linkPair(arr, i1, i2) {
  let next = unlinkPairAt(arr, i1)
  next = unlinkPairAt(next, i2)
  const id1 = arr[i1].track_id
  const id2 = arr[i2].track_id
  return next.map((c, i) => {
    if (i === i1) return { ...c, pair: true, object: false, pair_id: id2 }
    if (i === i2) return { ...c, pair: true, object: false, pair_id: id1 }
    return c
  })
}

// Marking a point as noise clears "object" (mutually exclusive) but
// keeps "pair" untouched. If the point is part of a pair, the partner
// is cascaded to noise too (and its object flag cleared), while its
// pair flag is also left untouched — this is how a point ends up
// showing BOTH the pair (square) and noise (triangle) outline at once.
export function labelAsNoiseWithCascade(arr, idx) {
  const c = arr[idx]
  const next = arr.map(x => ({ ...x }))
  next[idx] = { ...next[idx], noise: true, object: false }
  if (c.pair_id != null) {
    const partnerIdx = next.findIndex(x => x.track_id === c.pair_id)
    if (partnerIdx >= 0) {
      next[partnerIdx] = { ...next[partnerIdx], noise: true, object: false }
    }
  }
  return next
}

// Clears all labeling on a single point (and unlinks its pair if any).
// Only affects the clicked point — does not cascade to its old partner
// beyond removing the dangling pair_id reference.
export function clearLabelAt(arr, idx) {
  const next = unlinkPairAt(arr, idx)
  return next.map((c, i) =>
    i === idx ? { ...c, object: false, pair: false, noise: false, pair_id: null } : c
  )
}
