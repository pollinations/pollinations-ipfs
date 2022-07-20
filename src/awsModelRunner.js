
import { submitToAWS } from './aws.js';
import { writer } from './ipfsConnector.js';
import { subscribeGenerator } from './ipfsPubSub.js';
import { IPFSWebState } from './ipfsWebClient.js';

export async function* runModel (inputs, model="voodoohop/dalle-playground", executeOnDev=false)  {
    
    console.log("!!!!submitted inputs", inputs)
    const inputWriter = writer();
    const response = await submitToAWS(inputs, inputWriter, model, executeOnDev)
  
    console.log("got pollen id from aws", response)
    const { nodeID } = response
  
    const [cids, unsubscribe] = subscribeGenerator(nodeID, "/output");
  
    for await (const cid of cids) {
    
      console.log("!!!!received response",cid)
      const data = await IPFSWebState(cid);
      console.log("!!!!received response", data);
      
      if (data?.output) {
        yield data;
        
        if (data.output.done) {
          unsubscribe();
          return;
        }
      }
    }
  
}

const runModelOnce = async (inputs, model="voodoohop/dalle-playground", executeOnDev=false) => {

  // call runModel
  const outputs = runModel(inputs, model, executeOnDev)

  for await (const data of outputs) {

    const output = data.output;

    if (output.done) {
        // unsubscribe();
        console.log("unsubscribed");
        
        const outputEntries = Object.entries(output);
        
        // find the first entry whose key ends with .png or .jpg
        
        const [_filename, url] = outputEntries.find(([key]) => key.endsWith(".png") || key.endsWith(".jpg"))
        
        return url
    }
  }

}



export default runModelOnce;

