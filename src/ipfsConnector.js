
import { Buffer } from "buffer";
import Debug from "debug";
import { create } from "ipfs-http-client";
import { CID } from "multiformats/cid";
import path from "path-browserify";
import { last } from "ramda";
import { exportCIDBuffer, lsCID, pollenImporter } from "./pollenStoreClient.js";
import { noop, toPromise } from "./utils/utils.js";

const { join } = path;
const debug = Debug("ipfsConnector")

// Get IPFS_API_ENDPOINT from env
const IPFS_HOST = "https://api.pollinations.ai"


let _client = null;

// create a new IPFS session
export function getClient() {
    if (!_client) {
        _client = getIPFSDaemonURL().then(url => create({
            port: 5005,
            url, timeout: "2h",
        }))
    }
    return _client;
}


// basic IPFS read access
export async function reader() {

    return {
        ls: async cid => await ipfsLsCID(cid),
        get: async (cid, options = {}) => await ipfsGet(cid, options)
    }
}

// Create a writer to modify the IPFS state
// It creates a temporary folder in the IPFS mutable filesystem 
// so calling close is important
export function writer(initialRootCID = null) {

    // randomly assign a temporary folder in the IPFS mutable filesystem
    // in the future ideally we'd be running nodes in the browser and on colab and could work in the root
    // const mfsRoot = `/tmp_${(new Date()).toISOString().replace(/[\W_]+/g, "_")}`;

    const importer = pollenImporter();


    // Promise to a temporary folder in the IPFS mutable filesystem
    // let initializedFolder = null;
    
    // function initializeFolder()  {
    //     if (!initializedFolder) 
    //         initializedFolder = getClient().then(client => initializeMFSFolder(client, initialRootCID, mfsRoot))
    //     return initializedFolder;
    // }

    // calls the function with client and absolute path and finally return the root CID
    const returnRootCID = func => async (path = "/", ...args) => {

        // const client = await getClient()

        // await initializeFolder()
        // debug("join", mfsRoot, path)
        // const tmpPath = join(mfsRoot, path)

        // execute function
        await func(importer, path, ...args)

        const cid = await importer([])
        // return the root CID
        debug("returning root CID", cid)
        return cid; 
    };

    const methods = {
        add: returnRootCID(ipfsAdd),
        rm: returnRootCID(ipfsRm),
        mkDir: returnRootCID(ipfsMkdir),
        cid: returnRootCID(noop),
        cp: returnRootCID(ipfsCp),
        close: async () => {
            debug("closing input writer.")
        },
        pin: async cid => await ipfsPin(await getClient(), cid)
    }

    // const methodsWithRetry = mapObjIndexed(retryException, methods)

    return methods; //WithRetry
}



const localIPFSAvailable = async () => {
    return false;
}

const getIPFSDaemonURL = async () => {
    if (await localIPFSAvailable()) {
        debug("Ipfs at localhost:5001 is reachable. Connecting...");
        return "http://localhost:5001";
    }
    debug("localhost:5001 is not reachable. Connecting to", IPFS_HOST);
    return IPFS_HOST;
}


const ipfsCp = async (client, ipfsPath, cid) => {
    throw new Error("Not implemented");
    debug("Copying from ", `/ipfs/${cid}`, "to", ipfsPath)
    return await client.files.cp(`/ipfs/${cid}`, ipfsPath)
}

const ipfsPin = async (client, cid) => {
    debug("Pinning to remote nft.storage", cid)
    return await client.pin.remote.add(CID.parse(cid), {recursive: true, service: "nft_storage", background: true  })
    //debug("Pinning to pollinations", cid)
    return await client.pin.add(CID.parse(cid), { recursive: true })
}

export const getWebURL = (cid, name = null) => {
    const filename = name ? `?filename=${name}` : '';
    return `https://ipfs.pollinations.ai/ipfs/${cid}${filename}`
};

export const getIPNSURL = (id) => {
    return `https://ipfs.pollinations.ai/ipns/${id}`;
};

const stripSlashIPFS = cidString => {
    if (!cidString)
        throw new Error("CID is falsy");
    return cidString.replace("/ipfs/", "")
};

const firstLine = s => s.split("\n")[0];

export const stringCID = file => firstLine(stripSlashIPFS(file instanceof Object && "cid" in file ? file.cid.toString() : (CID.asCID(file) ? file.toString() : (file instanceof Buffer ? file.toString() : file))));

const _normalizeIPFS = ({ name, path, cid, type }) => ({ name, path, cid: stringCID(cid), type });

const ipfsLsCID = async (cid) => {
    // try {
    //     cid = await optionallyResolveIPNS(client, cid);
    //     debug("calling ipfs ls with cid", cid);
    //     const result = (await toPromise(client.ls(stringCID(cid))))
    //         .filter(o => o)
    //         .filter(({ type, name }) => type !== "unknown" && name !== undefined)
    //         .map(_normalizeIPFS);
    //     debug("got ipfs ls result", result);
    //     return result;
    // } catch (e) {
    //     console.log(e)
    // }
    const data = await lsCID(cid)
    return data;
}


const ipfsAdd = async (importer, path, content, options = { pin: false }) => {
    debug("adding", path, "options", options)
    debug("copying to", path)
    // try {

    const cid = await importer([{path, content}])
    debug("added", cid)
    // } catch (e) {
    //     debug("couldn't copy. file probably existed for some reason")
    // }
    return cid
}

// returns a buffer
const ipfsGet = async (cid) => {
    return await exportCIDBuffer(cid)
};

async function optionallyResolveIPNS(client, cid) {
    debug("Trying to resolve CID", cid)
    if (cid.startsWith("/ipns"))
        cid = await ipfsResolve(client, cid);
    return cid;
}

async function ipfsMkdir(importer, path) {
    debug("Creating directory", path)
    return await importer([{path, type: "directory"}])
}

async function ipfsRm(client, path) {
    debug("Deleting", path);
    try {
        await client.files.rm(path, { force: true, recursive: true });
    } catch (e) {
        debug(`couldn't delete "${path}"  because it probably doesn't exist`, e)
    }
}


const ipfsResolve = async (client, path) =>
    stringCID(last(await toPromise(client.name.resolve(path, { nocache: true }))));


const isCID = (cid) => {
    try {
        CID.parse(cid)
        return true
    } catch (e) {
        return false
    }
}

// test();