## Compute multiplication of 2 numbers

# Problem statement:
`I know secret key to public key that is among the given list of public keys (merkle tree) in the consensus.`

# Goal:
`The goal is to identify that the given public key is among the list without revealing the public key itself.`

## Let's Get Started
- Create a directory `outputs` to store the compiled files

# 1- To compile:
```bash
circom ./test/circuits/mkt2_circuit.circom --r1cs --wasm --sym -o outputs`
```

# 2- Setup input

- Create input.json inside the /inputs directory 

- We use strings instead of numbers because JavaScript does not work accurately with integers larger than 2^253

# 3- Computing the witness with WebAssembly

```bash
node ./outputs/mkt2_circuit_js/generate_witness.js ./outputs/mkt2_circuit_js/mkt2_circuit.wasm inputs/input.json witness.wtns`
```

## Powers of Tau Phase-1

### First, we start a new "powers of tau" ceremony:

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v`
```

### Then, we contribute to the ceremony:

```bash
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v`
```

## Powers of Tau Phase-2

- The phase 2 is circuit-specific. Execute the following command to start the generation of this phase:

```bash
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v`
```

Next, we generate a .zkey file that will contain the proving and verification keys together with all phase 2 contributions

- Execute the following command to start a new zkey:
```bash
snarkjs groth16 setup outputs/mkt2_circuit.r1cs pot12_final.ptau mkt2_circuit_0000.zkey`
```

- Contribute to the phase 2 of the ceremony:
```bash
snarkjs zkey contribute mkt2_circuit_0000.zkey mkt2_circuit_0001.zkey --name="1st Contributor Name" -v`
```

# 4- Export the verification key

```bash
snarkjs zkey export verificationkey mkt2_circuit_0001.zkey verification_key.json`
```

# 5- Generating a Proof

- Once the witness is computed and the trusted setup is already executed, we can generate a zk-proof associated to the circuit and the witness:
- This command generates a Groth16 proof and outputs two files:
  1- proof.json: it contains the proof.
  2- public.json: it contains the values of the public inputs and outputs.

```bash
snarkjs groth16 prove mkt2_circuit_0001.zkey witness.wtns proof.json public.json`
```

## Verifying a Proof

- To verify the proof, execute the following command:
```bash
snarkjs groth16 verify verification_key.json public.json proof.json`
```

- The command uses the files verification_key.json we exported earlier, proof.json and public.json to check if the proof is valid. If the proof is valid, the command outputs an OK.
- A valid proof not only proves that we know a set of signals that satisfy the circuit, but also that the public inputs and outputs that we use match the ones described in the public.json file.

## Verifying from a Smart Contract (Optional)

- It is also possible to generate a Solidity verifier that allows verifying proofs on Ethereum blockchain.

- First, we need to generate the Solidity code using the command:
```bash
snarkjs zkey export solidityverifier mkt2_circuit_0001.zkey solidity/verifier.sol`
```

- The Verifier has a view function called verifyProof that returns TRUE if and only if the proof and the inputs are valid. To facilitate the call, you can use snarkJS to generate the parameters of the call by typing:

```bash
snarkjs generatecall`
```

- Cut and paste the output of the command to the parameters field of the verifyProof method in Remix. If everything works fine, this method should return TRUE. You can try to change just a single bit of the parameters, and you will see that the result is verifiable FALSE.

## License

[MIT](https://choosealicense.com/licenses/mit/)