import { S3 } from 'aws-sdk/clients/s3';
// create S3 instance
import Debug from 'debug';


import { Errors } from 'blockstore-core';
import { BaseBlockstore } from 'blockstore-core/base';

const s3 = new S3();

const Bucket = "pollinations-ipfs";

const debug = Debug("s3store");

class S3Blockstore extends BaseBlockstore {
    constructor () {
      super()
  
      this.cache = {}
    }
    open () {
        
        return Promise.resolve()
    }

    close () {
        return Promise.resolve()
    }

    async put (key, val, options) {
        debug("put", key)
        // check if a block exists
        if (await this.has(key)) {
            debug("block already exists", key)
            return;
        }
        // store a block to the bucket
        const params = {
            Bucket,
            Key: key.toString(),
            Body: val
        };

        debug("put result", await s3.putObject(params).promise());
    }

    async get (key, options) {

        if (this.cache[key]) {
            debug("get cache hit", key)
            return this.cache[key];
        }
        // retrieve a block
        const params = {
            Bucket,
            Key: key.toString()
        };
        // debug("get", key, params)
        try {
            const { Body } = await s3.getObject(params).promise();
            debug("get from s3", key)

            // convert the boddy which is a buffer to a UInt8Array
            return new Uint8Array(Body);
        } catch (e) {
            throw Errors.notFoundError()
        }
    }

    async has (key, options) {
        // check if a block exists
        if (this.cache[key]) 
            return true;
            
        debug("has", key);
        const params = {
            Bucket,
            Key: key.toString()
        };
        try {
            await s3.headObject(params).promise();
            return true;
        } catch (err) {
            return false;
        }
    }

    async delete (key, options) {
        // delete a block
        const params = {
            Bucket,
            Key: key.toString()
        };
        await s3.deleteObject(params).promise();
    }

    async * _all () {
        // retrieve all blocks
        const params = {
            Bucket
        };
        const { Contents } = await s3.listObjectsV2(params).promise();
        for (const { Key } of Contents) {
            debug("returning all", Key)
            yield { key: Key, value: await this.get(Key) };
        }
    }

    async * _allKeys () {
        // retrieve all block keys
        const params = {
            Bucket
        };
        const { Contents } = await s3.listObjectsV2(params).promise();
        for (const { Key } of Contents) {
            yield Key;
        }
    }
}


// const params = {
//     Bucket,
//     Key: "test2.txt",
//     Body: new Uint8Array([1, 2, 3, 4, 5])
// };


// debug(await s3.putObject(params).promise());

// const { Body } = await s3.getObject({
//     Bucket,
//     Key: "test2.txt"
// }).promise();

// debug(new Uint8Array(Body));

export default S3Blockstore;







// class MemoryBlockstore extends BaseBlockstore {
//     constructor () {
//       super()
  
//       /** @type {Record<string, Uint8Array>} */
//       this.data = {}
//     }
  
//     open () {
//       return Promise.resolve()
//     }
  
//     close () {
//       return Promise.resolve()
//     }
  
//     /**
//      * @param {CID} key
//      * @param {Uint8Array} val
//      */
//     async put (key, val) { // eslint-disable-line require-await
//       debug("put", key, val)
//       this.data[base32.encode(key.multihash.bytes)] = val
//     }
  
//     /**
//      * @param {CID} key
//      */
//     async get (key) {
//       const exists = await this.has(key)
//       if (!exists) throw Errors.notFoundError()
//       return this.data[base32.encode(key.multihash.bytes)]
//     }
  
//     /**
//      * @param {CID} key
//      */
//     async has (key) { // eslint-disable-line require-await
//       return this.data[base32.encode(key.multihash.bytes)] !== undefined
//     }
  
//     /**
//      * @param {CID} key
//      */
//     async delete (key) { // eslint-disable-line require-await
//       delete this.data[base32.encode(key.multihash.bytes)]
//     }
  
//     async * _all () {
//       yield * Object.entries(this.data)
//         .map(([key, value]) => ({ key: CID.createV1(raw.code, Digest.decode(base32.decode(key))), value }))
//     }
  
//     async * _allKeys () {
//       yield * Object.entries(this.data)
//         .map(([key]) => CID.createV1(raw.code, Digest.decode(base32.decode(key))))
//     }
//   }
  

