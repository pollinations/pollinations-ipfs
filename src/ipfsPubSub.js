import Debug from 'debug';
// import { debounce } from 'lodash';
import { Channel } from 'queueable';
import { subscribePollen } from './supabase/pollen.js';


const debug = Debug('ipfs:pubsub');



// create a publisher that sends periodic heartbeats as well as contentid updates
export function publisher(nodeID) {
    
        
    debug("Creating publisher for", nodeID)

    const publish = () => console.error("publish does not exist anymore. do we need him?")

    const close = () => console.error("close called. publish does not exist anymore. do we need him?")

    return {
        publish,
        close
    };
}


// Generate an async iterable by subscribing to CIDs from a specific node id and suffix
export function subscribeGenerator(nodeID) {

    const channel = new Channel();

    debug("Subscribing to pubsub events from", nodeID);

    const unsubscribe = subscribeCID(nodeID,
        cid => channel.push(cid)
    );
    return [channel, unsubscribe];
}


// Subscribe to a content ids from a nodeID and suffix. Callback is called with the content ids
// Also receives and logs heartbeats received from the publisher
export function subscribeCID(nodeID, callback) {

    const closeSub = subscribePollen(nodeID, (res) => {
        if (res?.output)
            callback(res?.output);
    });
    return closeSub;    
    
};
