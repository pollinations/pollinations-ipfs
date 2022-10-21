import Debug from 'debug';
import { importer } from 'ipfs-unixfs-importer';
import {
    Web3Storage
} from 'web3.storage';
import S3Blockstore from './s3store.js';
;

const debug = Debug('web3storage');


const importOptions = {
    // maxChunkSize: 262144*20,
    // averageChunkSize: 262144*20,
    wrapWithDirectory: true,
}

const blockstore = new S3Blockstore()

let storage = null;

function initStorageIfNeeded() {
    if (storage)
        return;

    const token = process.env.WEB3STORAGE_TOKEN //args.token

    if (!token) {
        console.error('A token is needed. You can create one on https://web3.storage')
    }

    storage = new Web3Storage({
        token
    })
    
}

export async function importFromWeb3Storage(cid) {
    initStorageIfNeeded();

    debug("importing from web3 storage", cid);
    const result =  await storage.get(cid)

    const { files, ok } = result;
    debug("got result", ok)
    if (!ok)
        return false;
    
    debug("importing files from web3storage", files)

    try {
        const filesIterator = await files();

        const mappedFilesIterator = mapAsyncIterator(filesIterator, formatFileForUnixFSImport)

        let lastCID = null;
        
        for await (const file of importer(mappedFilesIterator, blockstore, importOptions)) {
            debug("Imported file", file.path, file.cid)
            lastCID = file.cid;
            // lastTree = file.tree;
        }
        return lastCID;
    } catch (e) {
        console.error("error when importing from web3.storage", e)
        console.trace()
        return false;
    }   
    
}


const formatFileForUnixFSImport = async (file) => {
    // if (file.type !== 'file') 
    //     return null;
    debug("mapping file", file, file.name, file.lastModified);

    const content = Buffer.from(await file.arrayBuffer());
    debug("content", content);
    // let buffer = Buffer.from(content)

    return { path: file.name, content } ;
};

const mapAsyncIterator = async function* (iterator, fn) {
    for await (const item of iterator) {
        const mapResult = await fn(item)
        if (mapResult) 
            yield mapResult
    }   
}

