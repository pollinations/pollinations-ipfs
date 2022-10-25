import fetch from 'node-fetch';
// create S3 instance
import Debug from 'debug';

import { Errors } from 'blockstore-core';
import { BaseBlockstore } from 'blockstore-core/base';


const debug = Debug("s3store");

// debug("s3head", s3.headObject)

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
        // // store a block to the bucket
        // const params = {
        //     Bucket,
        //     Key: key.toString(),
        //     Body: val,
        // };

        // debug("put result", await await s3.send(new PutObjectCommand(params)));

        // get a signed url from https://store.pollinations.ai/upload/[key]
        const urlResponse = await fetch(`https://store.pollinations.ai/upload/${key.toString()}`)
        const url = await urlResponse.text();
        debug("signed url", url)
        // upload to signed url
        // val is a Uint8Array
        const uploadResponse = await fetch(url, {
            method: "PUT",
            body: val,
            headers: {
                "Content-Type": "application/octet-stream"
            }
        });
        debug("upload response ok", uploadResponse.ok)
    }

    async get (key, options) {

        if (this.cache[key]) {
            debug("get cache hit", key)
            return this.cache[key];
        }
        // retrieve a block

        // debug("get", key, params)
        try {

            // get from https://pollinations-ipfs.s3.amazonaws.com/[key] using fetch
            debug("get from s3", key.toString())    
            const response = await fetch(`https://pollinations-ipfs.s3.amazonaws.com/${key.toString()}`);
            // convert to Uint8Array
            const buffer = await response.arrayBuffer();
            const result = new Uint8Array(buffer);
            this.cache[key] = result;
            return result;
            
        } catch (e) {
            console.error("error getting", e)
            throw Errors.notFoundError()
        }
    }

    async has (key, options) {
        // check if a block exists
        if (this.cache[key]) 
            return true;
            
        debug("has", key);
        // const params = {
        //     Bucket,
        //     Key: key.toString()
        // };
        // try {
        //     await s3.send(new HeadObjectCommand(params));
        //     return true;
        // } catch (err) {
        //     return false;
        // }

        // check if a block exists using fetch with a HEAD request
        const response = await fetch(`https://pollinations-ipfs.s3.amazonaws.com/${key.toString()}`, {
            method: "HEAD"
        });
        debug("has response", response.ok)
        return response.ok;
    }

    async delete (key, options) {
        // delete a block
        console.error("delete not implemented")
        throw new Error("delete not implemented")
    }

    async * _all () {
        // retrieve all blocks
        console.error("all not implemented")
        throw new Error("all not implemented")
    }

    async * _allKeys () {
        // retrieve all block keys
        console.error("allKeys not implemented")
        throw new Error("allKeys not implemented")
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




const streamToBuffer = (stream) => {
    // if you are using node version < 17.5.0
return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.once('end', () => resolve(Buffer.concat(chunks)))
    stream.once('error', reject)
})
}



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
  


