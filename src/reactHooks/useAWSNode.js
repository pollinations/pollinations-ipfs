import Debug from "debug";
import { useEffect, useState } from "react";
import { subscribeCID }  from "../ipfsPubSub.js"
import { submitToAWS } from "../aws.js";

const debug = Debug("useAWSNode");

const LOADING_NODEID = "submitted";

const useAWSNode = ({ nodeID: paramsNodeID, contentID: paramsContentID } ) => {

    const [nodeID, setNodeID] = useState(paramsNodeID);
    const [contentID, setContentID] = useState(paramsContentID);
    const ipfsWriter = useIPFSWrite()
    const ipfs = useIPFS(contentID);

    // set node ID to the node ID from URL
    useEffect(() => setNodeID(paramsNodeID), [paramsNodeID])

    // subscribe to content from node
    useEffect(() => {

        if (!nodeID || nodeID === LOADING_NODEID) return;

        // Update
        debug("nodeID changed to", nodeID, ". (Re)subscribing");
        
        const closeSub = subscribeCID(nodeID, "/output", setContentID);

        return closeSub;

    }, [nodeID])

    const submitToAWSAndSetState = async (values, notebook, dev) => {
        setNodeID(LOADING_NODEID);
        const {nodeID, contentID} = await submitToAWS(values, ipfsWriter, notebook, dev);
        setNodeID(nodeID);
        setContentID(contentID);
    }

    const isSubmitting = nodeID === LOADING_NODEID;

    // state is loading if it is submitting to AWS or if there is a nodeID but the output is not yet available
    const isLoading = isSubmitting || (nodeID && !ipfs?.output?.done);

    return { nodeID, contentID, setContentID, connected: true, submitToAWS: submitToAWSAndSetState, setNodeID, isLoading, ipfs  }

};

export default useAWSNode
