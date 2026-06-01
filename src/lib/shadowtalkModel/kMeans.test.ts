import { describe, expect, it } from "vitest";
import { kMeans } from "./kMeans";

describe("kMeans", () => {
  it("groups similar 2D points", () => {
    const clusterA = [
      [0, 0],
      [0.1, 0.05],
      [0.05, 0.1],
    ];
    const clusterB = [
      [5, 5],
      [5.1, 4.9],
      [4.95, 5.05],
    ];
    const vectors = [...clusterA, ...clusterB];
    const { assignments } = kMeans(vectors, 2, 30);
    expect(assignments[0]).toBe(assignments[1]);
    expect(assignments[0]).toBe(assignments[2]);
    expect(assignments[3]).toBe(assignments[4]);
    expect(assignments[3]).toBe(assignments[5]);
    expect(assignments[0]).not.toBe(assignments[3]);
  });
});
