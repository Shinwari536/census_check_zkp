// merkleTree2Test.js

const assert = require("chai").assert;
const circomlibjs = require("circomlibjs");

const {
  merkelize,
  getMerkleProof,
  isMerkleProofValid,
} = require("../circomjs/merkleTree2");

describe("Merkle Tree Test", function () {
  it("should correctly build a merkle tree and verify proofs", async () => {
    const eddsa = await circomlibjs.buildEddsa();
    const F = eddsa.F; // finite field from circomlibjs
    const poseidon = eddsa.poseidon; // hash function

    // Example leaves (public keys, or just numbers for test)
    const leaves = [11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n];
    const nLevels = 3; // since we have 4 leaves = 2^2

    // Build tree
    const tree = merkelize(F, poseidon, leaves, nLevels);
    const root = tree[tree.length - 1];

    // Pick a leaf to test
    const key = 2; // index of leaf
    const value = leaves[key]; // value of the leaf

    // Generate proof
    const proof = getMerkleProof(tree, key, nLevels);

    // Should be valid
    const isValid = isMerkleProofValid(
      F,
      poseidon,
      key,
      value, // value at that leaf
      root,
      proof
    );
    assert.isTrue(isValid, "Merkle proof should be valid");

    // Wrong value should fail
    const isInvalid = isMerkleProofValid(
      F,
      poseidon,
      key,
      123n, // wrong value
      root,
      proof
    );

    assert.isFalse(
      isInvalid,
      "Merkle proof with wrong value should be invalid"
    );
  });
});
