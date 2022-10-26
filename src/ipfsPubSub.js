import Debug from 'debug';
// import { debounce } from 'lodash';
import { Channel } from 'queueable';
import Store from './keyValueStore.js';
import { subscribePollen } from './supabase/pollen.js';


const debug = Debug('ipfs:pubsub');

const store = Store('colab_nodes');


// create a publisher that sends periodic heartbeats as well as contentid updates
export function publisher(nodeID) {
            
    debug("Creating publisher for", nodeID)

    const publish = contentID => {
        debug("Publishing", contentID)
        store.set(nodeID, contentID)
    }

    const close = () => debug("closing the publisher is a no-op")

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
// this still has two branches to support colab nodes
export function subscribeCID(nodeID, callback) {

    if (nodeID.startsWith('Qm')) {
        debug("Subscribing to", nodeID," for pollinator running on our own GPU backend");
        const closeSub = subscribePollen(nodeID, (res) => {
            if (res?.output)
                callback(res?.output);
        });
        return closeSub;    
    } else {
        debug("Subscribing to", nodeID," for pollinator running on Google Colab's GPU backend");
        const closeSub = store.subscribe(nodeID, callback);
        return closeSub;
    }
};
