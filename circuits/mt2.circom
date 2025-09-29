// merkleTree2.circom

pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/switcher.circom";

template Mkt2Verifier (nLevels) {
    signal input key;
    signal input value;
    signal input root;
    signal input siblings[nLevels];
    
    component n2b = Num2Bits(nLevels);
    component levels[nLevels];
    component hashV = Poseidon(1);
    
    n2b.in <== key;
    hashV.inputs[0] <== value;
    
     // Iterate from leaf level (i = 0) up to root level (i = nLevels-1)
    for (var i = 0; i < nLevels; i++) {
        levels[i] = Mkt2LevelVerifier();
        // Num2Bits outputs LSB at out[0], so bit i corresponds to level i from bottom
        levels[i].selector <== n2b.out[i];
        // siblings[0] should be sibling at leaf level, siblings[1] next level, ...
        levels[i].sibling <== siblings[i];
        // low for level 0 is the leaf hash, otherwise previous level's root
        levels[i].low <== (i == 0) ? hashV.out : levels[i-1].root;
    }
    
    // final root is at the highest level
    root === levels[nLevels-1].root;
}

template Mkt2LevelVerifier () {
    signal input sibling;
    signal input low;
    signal input selector;
    signal output root;
    component sw = Switcher();
    component hash = Poseidon(2);
    
    sw.sel <== selector;
    sw.L <== low;
    sw.R <== sibling;
    
    hash.inputs[0] <== sw.outL;
    hash.inputs[1] <== sw.outR;
    
    root <== hash.out;
}


//component main {public [root]} = Mkt2Verifier(3);