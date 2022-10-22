import Debug from 'debug';
import { recursive } from 'ipfs-unixfs-exporter';
import { importer } from 'ipfs-unixfs-importer';
import { assocPath } from 'ramda';
import getWebURL from './utils/getWebURL.js';
const debug = Debug('pollenStoreClient');

import json5 from "json5";
import path from 'path-browserify';
import S3Blockstore from './s3/s3store.js';
import { importFromWeb3Storage } from './supabase/web3storage.js';
export { getSignedURL } from './s3/s3client.js';
// Debug.enable("*");
const { extname } = path;

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
    return lastCID.toString();
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
        
        // the .cid property was added to allow easier caching and json diffs to consumers
        // it is not part of the actual data
        if (key === ".cid")
            continue;
        
            const value = obj[key];
        if (typeof value === "object") {
            result.push(...objectToFiles(value, `${path}/${key}`))
        } else {
            result.push({path: `${path}/${key}`, content: Buffer.from(JSON.stringify(value))})
        }
    }
    return result;
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
    const dirEntry = await fetchWithWeb3storageFallback(cid);
    // if  (dirEntry.type !== "directory")
    //     throw new Error("LS CID is not a directory:"+JSON.stringify(dirEntry)+" "+cid);
    debug("got dirent", dirEntry)
    const files = [];
    for await (const file of dirEntry) {
        debug("got file", file.path)
        files.push({name: file.name, path: file.name, cid: file.cid.toString(), type: file.type});
    }
    return files;
}

export async function exportCID(cid, processor=null) {

    if (!processor)
        processor = processFile;
        
    debug("exporting CID", cid)
    const entries = await fetchWithWeb3storageFallback(cid);
    debug("Got final entry", entries);

    let resultObj = {};
    
    const cidWithoutEndingSlash = cid.replace(/\/$/, "");
    for await (const file of entries) {
        debug("exporting file", file.name);
        
        // remove the input cid from the path
        const pathArray = file.path.replace(cidWithoutEndingSlash,"").split("/").slice(1);
        
        debug("path array", file.path, pathArray)
        if (file.type !== "directory") {
            debug("calling processfile for file", file.path);
            let value = await processor({
                path: pathArray.join("/"), 
                cid: file.cid, 
                rootCID: cid, 
                name: file.name,
                ...dataFetchers(file)
            });
            resultObj = assocPath(pathArray, value, resultObj);
        } else {
            resultObj = assocPath([...pathArray, ".cid"], file.cid.toString(), resultObj);
        }

    }
    debug("Got result", resultObj);
    return resultObj;
}

async function processFile({cid, path, name, ...file }) {
    let value = getWebURL(cid, name);
    // if there is no extension read the file as a JSON string
    // console.log("file path", file.path)
    if (!extname(path)) {
        if (path.length === 0) {
            debug("result is buffer. returning directly");
            value = await file.buffer();
        } else {
            try {
                value = await file.json();
            } catch (e) {
                debug("Could not parse file", file.path, "as JSON. Returning URL.");
            }
        }
    }
    return value;
}

async function extractContent(file) {
    let content = []
    for await (const chunk of await file.content()) {
        content = [...content, ...chunk];
    }
    return new Uint8Array(content);
}

function parse(content) {
    const str = contentToString(content);
    try {
        return json5.parse(str);
    } catch (e) {
        return str;
    }
}



function contentToString(content) {
    return String.fromCharCode.apply(null, content);
}

async function* fetchWithWeb3storageFallback(cid, skipWeb3storage=false) {
    debug("fetching", cid)
    try {
        const results = await recursive(cid, blockstore);
        if (typeof results[Symbol.asyncIterator] === "function")
            yield* results;
        else
            return results;
    } catch (e) {
        // check if exception is ERR_NOT_FOUND
        debug("Error fetching from S3", e);
    if (e.code === "ERR_NOT_FOUND" && !skipWeb3storage) {
            debug("cid not found locally. fetching from web3.storage");
            const importedCID = await importFromWeb3Storage(cid);
            
            debug("imported from web3.storage", importedCID);
            
            if (importedCID) {
                if (importedCID.toString() !== cid.toString()) 
                    console.error("imported CID does not match original CID", importedCID, cid,". Some annoyance with different block sizes. Update the CID in the database?");
                
                const results = await fetchWithWeb3storageFallback(importedCID, true);
                yield* results;
            } else {
                throw new Error("CID not found");
            }
        } else {
            throw e;
        }
    }
}


// Provide functions similar to http response for getting contents of a file on IPFS
const dataFetchers = (file) => {
    debug("creating data fetchers for cid",file.cid);
    return{
      json: async () => parse(await extractContent(file)),
      text: async () => contentToString(await extractContent(file)),
      buffer: async () => (await extractContent(file))
    };
};



// // const importedCID = await importFromWeb3Storage("QmVh1bMaeq5NwjWZPL8xXz6tUBiQcPshkzhwHesgS3Y8Nt");
// try {
//     let resultObj = await exportCID("QmXzEKNkacq3qPohCFwqs8NXZGvtfDL8B4KZyLeKSTdh3J");
//     // //     // await getDirectory(entry.unixfs);
//     console.log(resultObj)
//     const {mime} = await fileTypeFromBuffer(resultObj);
//     console.log(mime)
// } catch (e) {
//     console.error("erroir", e)
// }