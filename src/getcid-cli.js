import { IPFSWebState } from "./ipfsWebClient.js"

const cid = process.argv[2]

if (!cid) {
    console.log("Usage: node getcid-cli.js <cid>")
    process.exit(1)
}

(async () => {
    const stateJSON = await IPFSWebState(cid)
    console.log(JSON.stringify(stateJSON, null, 2))
})()

