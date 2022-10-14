

import Debug from "debug";
import { useCallback } from "react";
import { updateInput } from "../ipfsWebClient.js";


const debug = Debug("useIPFSInputWrite");

export default (ipfs, node) => {

    const { publish } = node;

    debug("publish", publish)

    const dispatch = useCallback(async inputState => {


        debug("dispatching", ipfs)
        const newContentID = await updateInput({ ...ipfs.input, ...inputState })

        debug("added input", inputState, "got cid", newContentID, "to state")

        debug("publishing with publish function", publish)
        publish(newContentID)

        // await writer.close()

        return newContentID;

    }, [publish, ipfs])


    return dispatch
}