#!/Users/andy/.nvm/versions/node/v16.16.0/bin/node
const Web3 = require('web3');
const Web3Token = require('web3-token');
const auth = require('ejabberd-auth');
global.fetch = require('node-fetch');

const { ERC725 } = require('@erc725/erc725.js');
const erc725schema = require('@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json');
const permissionsSchema = require('@erc725/erc725.js/schemas/LSP12IssuedAssets.json');
// Network and storage
const RPC_ENDPOINT = 'https://rpc.l16.lukso.network';
const IPFS_GATEWAY = 'https://2eff.lukso.dev/ipfs/';

// Parameters for the ERC725 instance
const provider = new Web3.providers.HttpProvider(RPC_ENDPOINT);
const config = { ipfsGateway: IPFS_GATEWAY };
const web3 = new Web3(provider);

const getData = async (address, keys, web3) => {
  const Contract = new web3.eth.Contract(
    [
      {
        stateMutability: 'view',
        type: 'function',
        inputs: [
          {
            internalType: 'bytes32[]',
            name: '_keys',
            type: 'bytes32[]',
          },
        ],
        name: 'getData',
        outputs: [
          {
            internalType: 'bytes[]',
            name: 'values',
            type: 'bytes[]',
          },
        ],
      },
    ],
    address
  );

  let data = [];
  try {
    data = await Contract.methods.getData(keys).call();
  } catch (err) {
    console.log(err.message);
  }
  return data;
};

async function readProfile(address, item) {
  try {
    const result = await getData(address, [item.key], web3);
    const schema = [item];
    const erc725 = new ERC725(schema, address, web3.currentProvider);

    const decodedData = erc725.decodeData([
      {
        keyName: item.name,
        result,
      },
    ]);

    if (item.keyType === 'Array') {
      const result = await erc725.getData(item.name);
      return result.value;
    }
    throw new Error('No address list found');
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  }
}

// if (require.main === module) {
//   const start = Date.now();
//   readProfile('0xd2b1E802390d7439cEf89728787A0097E2C64Be6', {
//     name: 'AddressPermissions[]',
//     key: '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3',
//     keyType: 'Array',
//     valueType: 'address',
//     valueContent: 'Address',
//   })
//     .then(value => {
//       console.log(value, Date.now() - start);
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('error', err, Date.now() - start);
//       process.exit(1);
//     });
// }

auth.run({
  actions: {
    auth: async function (done, userName, domain, password) {
      try {
        const { address, body } = await Web3Token.verify(password);
        if (userName === address) {
          return done(true);
        }
        // console.error(JSON.stringify({ body, address, userName, domain, password }, null, '  '));
        const results = await readProfile(userName, {
          name: 'AddressPermissions[]',
          key: '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3',
          keyType: 'Array',
          valueType: 'address',
          valueContent: 'Address',
        });
        const allowed = results.some(item => item.toLowerCase() === address.toLowerCase());
        // console.error(JSON.stringify({ results, allowed, address, userName, domain, password }, null, '  '));
        done(allowed);
      } catch (err) {
        console.error('Error', err);
        done(false);
      }
    },
  },
});
