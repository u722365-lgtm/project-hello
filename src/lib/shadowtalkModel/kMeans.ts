/** Lightweight k-means for embedding vectors (unsupervised topic discovery). */

function squaredDistance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const out = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) out[i] += v[i];
  }
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

function pickInitialCentroids(vectors: number[][], k: number): number[][] {
  const centroids: number[][] = [];
  const used = new Set<number>();
  while (centroids.length < k && used.size < vectors.length) {
    const idx = Math.floor(Math.random() * vectors.length);
    if (used.has(idx)) continue;
    used.add(idx);
    centroids.push([...vectors[idx]]);
  }
  return centroids;
}

export function kMeans(
  vectors: number[][],
  k: number,
  maxIter = 25,
): { assignments: number[]; centroids: number[][] } {
  if (vectors.length === 0) {
    return { assignments: [], centroids: [] };
  }
  const kk = Math.max(1, Math.min(k, vectors.length));
  let centroids = pickInitialCentroids(vectors, kk);
  const assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < vectors.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = squaredDistance(vectors[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }
    if (!changed && iter > 0) break;

    const groups: number[][][] = Array.from({ length: kk }, () => []);
    for (let i = 0; i < vectors.length; i++) {
      groups[assignments[i]].push(vectors[i]);
    }
    centroids = groups.map((g, idx) => (g.length > 0 ? meanVector(g) : centroids[idx]));
  }

  return { assignments, centroids };
}

export function nearestCentroid(
  vector: number[],
  centroids: number[][],
): { index: number; similarity: number } {
  if (centroids.length === 0) return { index: -1, similarity: 0 };
  let best = 0;
  let bestSim = -Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const dist = squaredDistance(vector, centroids[i]);
    const sim = 1 / (1 + dist);
    if (sim > bestSim) {
      bestSim = sim;
      best = i;
    }
  }
  return { index: best, similarity: bestSim };
}
