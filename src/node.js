const express = require("express");
const bodyParser = require("body-parser");
const request = require("sync-request");
const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Require Blockchain code
const blockchain = require("./blockchain.js");

// Create a unique identifier to the node
const node_identifier = Math.floor((1 + Math.random()) * 0x10000).toString(16);

// List of nodes in the network
const nodes = new Set();

// Create a unique address for the node
// (we will use this as the server port)
const port = 3000 + Math.trunc(Math.random() * 1000);

/**
 * Add a new node to the list of nodes
 *
 * @param {String} address Address of the node. Eg. 'http://localhost:5000'
 */
app.post("/node/register", (req, res) => {
  const node_address = req.body.address;

  nodes.add(node_address);

  res.send(`A new node added: ${node_address}`);
});

/**
 * This is our Consensus Algorithm, it resolves conflicts
 * by replacing our chain with the longest one in the network.
 */
app.post("/node/resolve", (req, res) => {
  // The Consensus Algorithm
  // This will ensure that each node has the correct chain
  const chains = [];

  nodes.forEach(function chain(address) {
    const response = request("GET", `${address}/chain`);
    const body = JSON.parse(response.getBody("utf8"));

    chains.push(body);
  });

  const chain = blockchain.chain;

  blockchain.resolve_conflicts(chains);

  if (blockchain.chain !== chain) {
    res.send("Chain updated to the longest chain in the network");
  } else {
    res.send("Chain not updated");
  }
});

/**
 * Mine a new node and add it to the blockchain
 */
app.post("/mine", (req, res) => {
  // Reward the miner by adding a transaction granting 1 coin
  blockchain.new_transaction(0, node_identifier, 1);

  // Calculate the Proof of Work
  const last_block = blockchain.last_block();
  const proof = blockchain.proof_of_work(last_block.proof);

  // Forge the new block by adding it to the chain
  const new_block = blockchain.new_block(proof, blockchain.hash(last_block));

  res.send(new_block);
});

/**
 * Add a new transaction to the list of transactions
 *
 * @param {String} sender Sender address
 * @param {String} recipient Recipient address
 * @param {Number} amount Total of coins
 */
app.post("/transactions/new", (req, res) => {
  const { sender, recipient, amount } = req.body;

  const index = blockchain.new_transaction(sender, recipient, amount);

  res.send(`Transaction will be added to Block ${index}`);
});

/**
 * Get chain
 */
app.get("/chain", (req, res) => {
  res.send(blockchain.chain);
});

app.listen(port, () => {
  console.log(`Blockchain node running on port ${port}...`);
});
