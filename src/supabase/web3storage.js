import Debug from 'debug';
import { importer } from 'ipfs-unixfs-importer';
import PQueue from 'p-queue';
import { timeout } from 'promise-timeout';
import {
    Web3Storage
} from 'web3.storage';
import S3Blockstore from './s3store.js';
;

const importOptions = {
    // maxChunkSize: 262144*20,
    // averageChunkSize: 262144*20,
    wrapWithDirectory: true,
}

const blockstore = new S3Blockstore()

const debug = Debug('web3storage');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDU3NTM0NzQyMDkwZjVjMjZCRTdiMmFFZUVGQ2NBZDM2NTNhODM5N0MiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTE4NDczOTg0ODcsIm5hbWUiOiJwb2xsaW5hdGlvbnMifQ.s7smzTFAmfMDkBvIg1rtArcvtMasE11z1pnRexNhz6A" //args.token

if (!token) {
   console.error('A token is needed. You can create one on https://web3.storage')
}

const storage = new Web3Storage({
    token
})


export async function importFromWeb3Storage(cid) {
    debug("importing from web3 storage", cid);
    const {ok, unixFsIterator: files} =  await storage.get(cid)
    

    debug("got result", ok)
    if (!ok)
        return false;
    
    debug("importing files from web3storage", files)
    // for await (const file of await unixFsIterator()) {
    //     console.log("got file", file)
    // }

    // const treeBuilder = statefulTreebuilder;

    // const filesIterator = createAndYieldFiles();
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
    debug("mapping file", file, file.name, file.type);
    if (file.type === "directory") {
        return {
           ...file,
           content: null,
        }
    }
    return {
        ...file,
        content: await extractContent(file).buffer,
    }
    const content = Buffer.from(await file.arrayBuffer());
    debug("content", content);
    // let buffer = Buffer.from(content)

    return { path: file.name, content
        // , mode: file.mode, mtime: file.lastModified  
    } ;
};

const mapAsyncIterator = async function* (iterator, fn) {
    for await (const item of iterator) {
        const mapResult = await fn(item)
        if (mapResult) 
            yield mapResult
    }   
}


async function extractContent(file) {
    let content = new Uint8Array();
    for await (const chunk of await file.content()) {
        content = [...content, ...chunk];
    }
    return content;
}

const cids = [
"QmcJe7Umf4mH5x6Xi9kMAiGvdiMaaaQn1XsS6GAqgjpsgD",
// "QmXMAvPvawu1gLYuEq23j5R386w3j2m3XS3UBHdBF5qshF",
// "QmXwr676mZDzr5qeC9AfspvvH2J3bZYhxUDqqULU2Q48zA",
// "QmaJGpEqDaVTzVQjytpMNYhhEbm8a71b4AXcHw41b6cSGP",
// "QmXUHC2E3rGiRYQMoAX57K3CkV8685WGmoUNzZ9gD49ZbC",
// "QmSPYTvbJYcGefoDBjWNwAMJfWYKXCscuj8vPxH6EeFs4x",
// "QmWgJfVmYgAX9igt2snN2ceZX9C6Roqj6MQr4tjX84NBCd",
// "QmRz7MHeZBHWRMVEC5X84mdWCYimAPAnU71RPuuvdssEco",
// "QmdZiujGS6F8gEXEToJ6WSy75m4Ui2XUUqvMjrfgM21V7U",
// "QmanAYeqifvSidk5VWDmvhNCtpf2K2peeM2rDuBxhUf4GG",
// "QmZcnhfqueKCFx49YMrJCJRg7C45CVH2BFr69VJvqF2g8N",
// "QmcytjTd3rzogZ7FuggfiTcx4qHcfiCppXqRmcqQXSLr44",
// "Qme9P8JsgYSSiL4j7kTgVZS3XE3aatabrA1UycRU7vStXG",
// "QmXeryZn72skZfcqLaocTzLSExnY3SpBMrh3Ac73u2HwAp",
// "QmXLkeqEPo1sVg4s7UTrChwWF28ndDM7DAR7qyHej256L6",
// "QmRT2Xqo4PhAaw5qNfzmYH5tW7WVgreHtBkHobeB7WedWL",
// "QmYumXsHPrVmX9inxXUo4wuH47VCusV2CXk87PXDZ8mWJd",
// "QmcfTH1j845MJnBpnHwFJSyKgbSiphvywwTnQcaTJB4iQV",
// "QmcjZ1PysFDtTTUWzfb1EnTQgFvyp9rmJKSnDKEdhJbM9y",
// "QmYzQzM9Mwzs92Ptixrtyz7cwUgrbRaxE1fMq1mbCLKYYJ",
// "QmQ82m49qquDFGZd6wUqFgX8rPfoHDqmDtTrwzKgLAJLah",
// "QmQo3B23PdqzVeK9bcSP5dEegqVSBfAaYDC7wven8zqSA8",
// "QmP4N8zXFig7QznUGfcM9cmbXTrj18chnsyhutX6oCRDnq",
// "QmVgzQ1EEiVvYVk3e6RSF2DHfU47u8cyFjj5bPPKpt6ccD",
// "QmfPbhbQA6zXuRTQzG3zioDw9kGFcmi9aLR9unZEXA7Lni",
// "QmaRDRzxWFy9eBxvEUSPPrkbtA6PHMFy3D7evT3ZJshGbd",
// "QmNtKLKPHqCCJWTHFoymSyA8x4q55Vfs1X99hGAcdwSVZn",
// "QmWkhsPxBj4qpavXGYoVaTLXBbmbXsJ2M9KtvbGPLLUJ8e",
// "QmSVA5JgG2tQ4MhRErTfn14fzgLoC1pUjkS3wCHXwMynXE",
// "QmQa9C3JeVnf117GGBKcrDLAHVDBGPAYQw4vdrmpjYWDHd",
// "QmdTp4aPW6PgAMC8epmTFgsGtEAACzBVXzSzbAedWtyB8y",
// "Qmf44Zfm8qrnKc9TKu9N6psU9UjNSS5qC9zCCTXkqtkESg",
// "QmQCA4F6GhtnxePgB1sRi33gLEHc6XxDnoap5vNn6XHoxn",
// "QmRpcvPnvqdJV6kB8Z9t7etLbofSaQdPd4nXoyVo1vzmmj",
// "QmV5TjFaeGQABE4o7h28g22kJS8vzF2qjFfauA4te8AD1q",
// "QmS4jwv3AD3Ar4yexwfYjRDtTyrkYcCmMMcVuqy9kKupm3",
// "QmYvi4mGVBsjcj6wfWoLXFTKm7qiK3J7g4nbemtFVR1kDy",
// "QmYAvpsKQkn7R9MvfkP59549yGCEophvUnpWFnh1yvB6wZ",
// "QmS1nrdv8WjSc4nhiYPFd75vKVjWwyGCGraLkKW21DMn4f",
// "QmP4ueBKEJ8XJ15s4HN5YHArUu1nexijpSztQaovpyg1L3",
// "QmYa3zGtQmm3UUXmDcjJVh1rK9PMHgQA32yQisPXVq1yAM",
// "QmepZRAWkCWeLN6Ue5iNSoiJs9bY4BY1VxSJWEWg7wpXiz",
// "QmQChxyMtZVv32pH6fURkyPevxVTVGcJr7MUsKtCmo3kib",
// "QmRDBWuPuoDT1NXWvkudgA7W6DeBT4awATUExFzKBLkxvF",
// "QmQQZdgq71rEpE1TXpyZvyYn7Zn7W2iuTEtkUPJ5cDaCQx"
]

const queue = new PQueue({concurrency: 10});


for (const cid of cids) {

   queue.add(() => {
    return timeout(importFromWeb3Storage(cid), 30000).catch(e => console.error("timeout"))
   })
}