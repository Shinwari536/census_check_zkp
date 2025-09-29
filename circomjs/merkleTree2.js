//merkleTree2.js

/** Creates a merkle tree from a list of public keys (or just numbers)
 *
 * @param {*} F - Finite field
 * @param {Function} hash - Hash function
 * @param {Array<Object>} listOfPKs - List of public keys (or just numbers)
 * @param {Number} nLevels - Number of levels in the tree
 * @returns {Array<String>} Merkle tree as a flat array
 */
function merkelize(F, hash, listOfPKs, nLevels) {
  const numberOfHashElements = 1 << nLevels;
  const hashArray = [];
  for (let i = 0; i < numberOfHashElements; i++) {
    if (i < listOfPKs.length) {
      hashArray.push(hash([F.e(listOfPKs[i])]));
    } else {
      hashArray.push(F.zero);
    }
  }

  return __merkelize(hash, hashArray);
}

/** Helper function to recursively build the merkle tree
 *
 * @param {poseidon} hash - Hash function
 * @param {Array<Object>} hashArray - List of hashed leaves
 * @returns {Array<String>} Merkle tree as a flat array
 */
function __merkelize(hash, hashArray) {
  if (hashArray.length === 1) return hashArray;
  const newHashArray = [];
  for (let i = 0; i < hashArray.length / 2; i++) {
    newHashArray.push(hash([hashArray[2 * i], hashArray[2 * i + 1]]));
  }

  const merkleTree = __merkelize(hash, newHashArray);
  return hashArray.concat(merkleTree);
}

/** Generates a merkle proof for a given leaf
 *
 * @param {Array<String>} merkleTree - Merkle tree as a flat array
 * @param {Number} key - Index of the leaf to generate the proof for
 * @param {Number} nLevels - Number of levels in the tree
 * @returns {Array<String>} Merkle proof as an array of sibling hashes
 */
function getMerkleProof_old(merkleTree, key, nLevels) {
  //   if (nLevels === 0) return [];
  //   const expectedLength = 1 << nLevels;
  //   const topSiblings = getMerkleProof(merkleTree, key >> 1, nLevels - 1);
  //   const curSibling = merkleTree[expectedLength - 1 + (key ^ 1)];
  //   return topSiblings.concat([curSibling]);

  if (nLevels === 0) return [];
  const expectedLength = 1 << nLevels;
  const curSibling = merkleTree[expectedLength - 1 + (key ^ 1)];
  const topSiblings = getMerkleProof(merkleTree, key >> 1, nLevels - 1);
  return [curSibling].concat(topSiblings); // <-- flip order
}

/**
 * Generates a Merkle proof for a given leaf.
 *
 * @param {Array<bigint>} merkleTree - Merkle tree as a flat array (leaves first, root last)
 * @param {Number} key - Index of the leaf to generate the proof for
 * @param {Number} nLevels - Number of levels in the tree
 * @returns {Array<bigint>} Merkle proof as an array of sibling hashes
 */
function getMerkleProof(merkleTree, key, nLevels) {
  const proof = [];
  let idx = key;

  // Offset at which the current level starts
  let levelStart = 0;
  let levelSize = 1 << nLevels; // number of leaves

  for (let level = 0; level < nLevels; level++) {
    const isRight = idx & 1; // whether current node is a right child
    const siblingIdx = isRight ? idx - 1 : idx + 1;

    proof.push(merkleTree[levelStart + siblingIdx]);

    // Move up one level
    idx >>= 1;
    levelStart += levelSize;
    levelSize >>= 1;
  }

  return proof;
}

/** Verifies a merkle proof for a given leaf and root
 *
 * @param {*} F - Finite field
 * @param {Function} hash - Hash function
 * @param {Number} key - Index of the leaf
 * @param {String} value - Value of the leaf
 * @param {String} root - Root hash of the merkle tree
 * @param {Array<String>} merkleProof - Merkle proof as an array of sibling hashes
 * @returns {Boolean} True if the proof is valid, false otherwise
 */
function isMerkleProofValid(F, hash, key, value, root, merkleProof) {
  // reconstruct the root from the leaf and the proof
  // value is the raw leaf (e.g. 33n); merkelize stored hash([F.e(value)])
  let h = hash([F.e(value)]);

  // proof is ordered bottom -> up: proof[0] = sibling at leaf level, proof[1] = sibling at next level, ...
  for (let i = 0; i < merkleProof.length; i++) {
    const sibling = merkleProof[i];
    // if bit i of key is 1, current node was the right child at this level
    if (((key >> i) & 1) === 1) {
      h = hash([sibling, h]);
    } else {
      h = hash([h, sibling]);
    }
  }

  return F.eq(root, h);
}

module.exports = {
  merkelize,
  getMerkleProof,
  isMerkleProofValid,
};
