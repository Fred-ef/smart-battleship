const mt = require('@openzeppelin/merkle-tree');
const crypto = require('crypto');

const salts = [
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex'),
    '0x'+crypto.randomBytes(32).toString('hex')
]

const values = [
    [0, true, salts[0]],
    [1, false, salts[1]],
    [2, false, salts[2]],
    [3, false, salts[3]],
    [4, false, salts[4]],
    [5, false, salts[5]],
    [6, false, salts[6]],
    [7, false, salts[7]],
    [8, false, salts[8]],
    [9, false, salts[9]],
    [10, false, salts[10]],
    [11, false, salts[11]],
    [12, false, salts[12]],
    [13, false, salts[13]],
    [14, false, salts[14]],
    [15, false, salts[15]]
];

const tree = mt.StandardMerkleTree.of(values, ["uint8", "bool", "bytes32"]);

console.log("Root: ", tree.root);

for (const [i, v] of tree.entries()) {
    console.log("Value: "+v);
    console.log("Proof: "+tree.getProof(i));
}