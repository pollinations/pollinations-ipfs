import Debug from 'debug';
import { exporter, recursive } from 'ipfs-unixfs-exporter';
import { importer } from 'ipfs-unixfs-importer';
import { extname } from 'path';
import { assocPath } from 'ramda';
import { getWebURL } from './ipfsConnector.js';
const debug = Debug('pollenStoreClient');

import S3Blockstore from './supabase/s3store.js';
import { importFromWeb3Storage } from './supabase/web3storage.js';


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


// const importedCID = await importFromWeb3Storage("QmVh1bMaeq5NwjWZPL8xXz6tUBiQcPshkzhwHesgS3Y8Nt");
try {
let resultObj = await exportCID("QmbhSy19HrWaMT5Hmh14xzTwubbJV6LKcKoifvYf9Bqqod");
// //     // await getDirectory(entry.unixfs);
console.log(resultObj)

} catch (e) {
    console.error("erroir", e)
}
export async function exportCIDBuffer(cid) {
    const entries = await fetchWithWeb3storageFallback(cid);
    for await (const file of entries) {
        debug("extracting content of", file)
        const content = await extractContent(file);
        return content;
    }
}

export async function lsCID(cid) {
    const dirEntry = await fetchWithWeb3storageFallback(cid, exporter);
    if  (dirEntry.type !== "directory")
        throw new Error("LS CID is not a directory");

    const files = [];
    for await (const file of dirEntry.content()) {
        files.push({name: file.name, path: file.name, cid: file.cid.toString(), type: file.type});
    }
    return files;
}

export async function exportCID(cid) {

    debug("exporting CID", cid)
    const entries = await fetchWithWeb3storageFallback(cid);
    debug("Got final entry", entries);

    let resultObj = {};
    
    for await (const file of entries) {
        debug("exporting file", file);
        if (file.type !== "directory") {
            
            let value = getWebURL(file.cid);

            // if there is no extension read the file as a JSON string
            if (!extname(file.path)) {
                value = await extractContent(file);
                if (file.path.split("/").length === 1) { 
                    debug("result is buffer. returning directly")
                    return value.buffer
                } else {
                    try {
                        value = parse(value);
                    } catch (e) {
                        debug("Could not parse file", file.path, "as JSON. Returning raw.");
                    }
                }
            }
            resultObj = assocPath(file.path.split("/"), value, resultObj);
        }

    }
    debug("Got result", resultObj);
    return resultObj[Object.keys(resultObj)[0]];
}

async function extractContent(file) {
    let content = []
    for await (const chunk of await file.content()) {
        content = [...content, ...chunk];
    }
    return new Uint8Array(content);
}

function parse(content) {
    const str = String.fromCharCode.apply(null, content);
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}



async function* fetchWithWeb3storageFallback(cid,func=recursive,skipWeb3storage=false) {
    try {
        const results = await func(cid, blockstore);
        yield* results;
    } catch (e) {
        // check if exception is ERR_NOT_FOUND
        debug("Error fetching from S3", e.code);
    if (e.code === "ERR_NOT_FOUND" && !skipWeb3storage) {
            debug("cid not found locally. fetching from web3.storage");
            const importedCID = await importFromWeb3Storage(cid);
            
            debug("imported from web3.storage", importedCID);
            
            if (importedCID) {
                if (importedCID.toString() !== cid.toString()) 
                    console.error("imported CID does not match original CID", importedCID, cid,". Some annoyance with different block sizes. Update the CID in the database?");
                
                const results = await fetchWithWeb3storageFallback(importedCID, func, true);
                yield* results;
            } else {
                throw new Error("CID not found");
            }
        } else {
            throw e;
        }
    }
}