import Debug from 'debug';
import { recursive } from 'ipfs-unixfs-exporter';
import { importer } from 'ipfs-unixfs-importer';
import { extname } from 'path';
import { assocPath } from 'ramda';
import { getWebURL } from '../ipfsConnector.js';
const debug = Debug('pollenStoreClient');

import S3Blockstore from './s3store.js';
import { importFromWeb3Storage } from './web3storage.js';


const blockstore = new S3Blockstore()

const importOptions = {
    // maxChunkSize: 262144*20,
    // averageChunkSize: 262144*20,
    wrapWithDirectory: true,
}


// import a javascript object to our ipfs blockstore
export async function importJSON(inputs) {
    let lastCID = null;

    const files = objectToFiles(inputs);

    for await (const file of importer(files, blockstore, importOptions)) {
        debug("Imported file", file.path, file.cid)
        lastCID = file.cid;
        // lastTree = file.tree;
    }
    return lastCID;
}

export function pollenImporter() {
    let lastTree = null;
    let lastCID = null;
    const addFiles = async files => {
        debug("Adding files",files)
        if (files.length === 0)
            return lastCID;
            
        for await (const file of importer(files, blockstore, {...importOptions, tree: lastTree })) {
            debug("Imported file", file.path, file.cid)
            lastCID = file.cid.toString();
            lastTree = file.tree;
        }
        return lastCID;
    }

    return addFiles;
}

// convert the object to an array of files in the format {"path" : "/path/to/file", "content": <content>}
function objectToFiles(obj, path="") {  
    const result = [];
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === "object") {
            result.push(...objectToFiles(value, `${path}/${key}`))
        } else {
            result.push({path: `${path}/${key}`, content: Buffer.from(JSON.stringify(value))})
        }
    }
    return result;
}


// const cid = await importJSON({a: {b:  "hello"}})

let resultObj = await exportCID("QmaMtjjZnUMNmXzRMtk287N8UPVDdPcaFULrJ22Jxoapu4");
    // await getDirectory(entry.unixfs);


console.log(resultObj)



export async function exportCID(cid) {
    try {
    debug("exporting CID", cid)
    const entries = await recursive(cid, blockstore);
    debug("Got final entry", entries);

    let resultObj = {};
    
    for await (const file of entries) {
        debug("exporting file", file.path);
        if (file.type !== "directory") {
            
            let value = getWebURL(file.cid);

            // if there is no extension read the file as a JSON string
            if (!extname(file.path)) 
                value = parse(await extractContent(file));

            resultObj = assocPath(file.path.split("/"), value, resultObj);
        }

    }
    debug("Got result", resultObj);
    return resultObj[Object.keys(resultObj)[0]];
    } catch (e) {
        // check if exception is ERR_NOT_FOUND
        if (e.code === "ERR_NOT_FOUND") {
            debug("cid not found locally. fetching from web3.storage");
            const importedCID = await importFromWeb3Storage(cid);
            
            debug("imported from web3.storage", importedCID);
            
            
            if (importedCID) {
                if (importedCID !== cid) 
                    console.error("imported CID does not match original CID", importedCID, cid,". Some annoyance with different block sizes. Update the CID in the database?");
                return await exportCID(importedCID);
            } else {
                throw new Error("CID not found");
            }
        } else {
            throw e;
        }
    }
}

async function extractContent(file) {
    let content = new Uint8Array();
    for await (const chunk of await file.content()) {
        content = [...content, ...chunk];
    }
    return content;
}

function parse(content) {
    const str = String.fromCharCode.apply(null, content);
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}

