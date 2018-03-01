const sha256 = require("sha256");

// Blockchain
module.exports = (function blockchain() {
  "use strict";

  // The blockchain
  let chain = [];
  // Current transactions
  let current_transactions = [];
  // Genesis block
  let genesis_block;

  /**
   * Creates a SHA-256 hash of a Block
   *
   * @param {Object} block
   *
   * @returns {String} The sha256 hash
   */
  const hash = block => {
    return sha256(JSON.stringify(block));
  };

  /**
   * Creates a new Block and adds it to the blockchain
   *
   * @param {Number} proof The Proof of Work
   * @param {?String} previous_hash Previous block's hash
   *
   * @returns {Object} New Block
   */
  const new_block = (proof, previous_hash = null) => {
    const block = {
      index: chain.length + 1,
      time: Date.now(),
      transactions: current_transactions,
      proof: proof,
      previous_hash: previous_hash || hash(chain[chain.length - 1])
    };

    // Reset list of current transactions
    current_transactions = [];

    // Add new block to the blockchain
    chain.push(block);

    return block;
  };

  /**
   * Creates a new transaction and adds it to the current list of transactions
   *
   * @param {String} sender Address of the sender
   * @param {String} recipient Address of the recipient
   * @param {Number} amount Amount
   *
   * @returns {Number} The index of the Block to which the transaction will be added
   */
  const new_transaction = (sender, recipient, amount) => {
    const transaction = {
      sender,
      recipient,
      amount
    };

    // Add new transaction to the list of transactions to be added to the next block
    current_transactions.push(transaction);

    return chain.length + 1;
  };

  /**
   * Simple Proof of Algorithm:
   * - Find the number p' such that sha256(pp') has 4 leading zeroes, where
   * - p' is the previous Block's proof and p is the new proof
   *
   * @param {String} previous_proof The proof from the previous Block
   *
   * @returns {Number} proof
   */
  const proof_of_work = previous_proof => {
    // Start with the base proof (aka. nonce)
    let proof = 0;

    while (!valid_proof(previous_proof, proof)) {
      proof += 1;
    }

    return proof;
  };

  /**
   * Validates a proof
   * It verifies if the sha256(previous_proof, proof) contain 4 leading zeros.
   *
   * @param {String} previous_proof The proof from the previous Block
   * @param {String} proof The new proof
   *
   * @returns {Boolean} True if correct, False otherwise
   */
  const valid_proof = (previous_proof, proof) => {
    // What does it means for a proof to be valid.
    const guess = `${previous_proof}${proof}`;
    const hash_guess = sha256(guess);

    return hash_guess.slice(0, 4) === "0000";
  };

  /**
   * Determines if a given blockchain is valid
   *
   * @param {Array} chain Blockchain
   *
   * @returns {Boolean} True if valid, False otherwise
   */
  const valid_chain = chain => {
    return chain.every((block, id) => {
      // Validate Genesis Block
      if (id === 0) {
        return block.proof === 0;
      }

      // Validate Block
      const previous_block = chain[id - 1];

      return (
        // Validate index
        previous_block.index > block.index &&
        // Validate hash
        hash(previous_block) === block.previous_hash &&
        // Validate Proof of Work
        valid_proof(previous_block, block)
      );
    });
  };

  /**
   * Resolves the conflits by replacing the chain by the longest one in the network
   *
   * @param {Array} chains List of all known chains
   */
  const resolve_conflicts = chains => {
    chains.forEach(proposed_chain => {
      if (proposed_chain.length <= chain) {
        return;
      }

      if (!valid_chain(proposed_chain)) {
        return;
      }

      // Replace chain for the new long chain
      chain = proposed_chain;
    });
  };

  /**
   * Retrieves the last mined Block
   *
   * @returns {Object} Last mined Block
   */
  const last_block = () => {
    return chain[chain.length - 1];
  };

  /** Create the Genesis Block */
  {
    genesis_block = new_block(0, 100);
  }

  // API
  return {
    // Data
    chain,
    // Operations
    new_block,
    new_transaction,
    proof_of_work,
    last_block,
    hash,
    valid_chain,
    resolve_conflicts
  };
})();
