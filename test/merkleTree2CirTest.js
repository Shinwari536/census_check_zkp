// merkleTree2CirTest.js

const path = require("path");
const wasm_tester = require("circom_tester").wasm;

const circomlibjs = require("circomlibjs");

let hash, F;

const { merkelize, getMerkleProof } = require("../circomjs/merkleTree2");

describe("Check Merkle tree Circuit", function () {
  let circuit;

  this.timeout(10000000);

  before(async () => {
    const eddsa = await circomlibjs.buildEddsa();
    F = eddsa.F; // finite field from circomlibjs
    hash = eddsa.poseidon; // hash function

    circuit = await wasm_tester(
      path.join(__dirname, "circuits", "mkt2_circuit.circom")
    );
  });

  it("Should check inclusion in Merkle Tree", async () => {
    // Example leaves (public keys, or just numbers for test)
    const leaves = [11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n];
    const nLevels = 3; // since we have 4 leaves = 2^2

    // Build tree
    let tree = merkelize(F, hash, leaves, nLevels);
    tree = tree.map((x) => F.toObject(x));

    const root = tree[tree.length - 1];

    // Pick a leaf to test
    const key = 2; // index of leaf
    const value = leaves[key]; // value of the leaf

    console.log("Value Hash:", F.toObject(hash([F.e(value)])));

    // Generate proof
    let proof = getMerkleProof(tree, key, nLevels);

    console.log("Tree:", tree);

    const input = {
      key: F.toObject(F.e(key)),
      value: F.toObject(F.e(value)),
      root: root,
      siblings: proof,
    };

    console.log("Input:", input);

    await circuit.calculateWitness(input, true);
  });
});
