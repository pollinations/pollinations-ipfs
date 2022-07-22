import supabase from "./client.js";
import { Channel } from 'queueable';

export function getAllPollens() {
    return supabase.from("pollen").select("*").then(response => {
        return response.data
    })
}

export function dispatchPollen(params) {
    return supabase
            .from("pollen")
            .insert(params)
            .then(({data}) => data);
}

// subscribe to 
export async function subscribePollen(input, callback) {

    const contentID = await getPollen(input);

    if (contentID) {
        callback(contentID);
        
        // return if job was already done
        if (contentID.final_output)
            return () => null;
    }

    
    const subscriptionHandler = ({new:data}) => { 
        callback(data);
        if (data.final_output) {
            supabase.removeSubscription(subscription)
        }
    }

    const subscription = supabase
        .from(`pollen:input.eq.${input}`)
        .on("UPDATE", subscriptionHandler)
        .on("INSERT", subscriptionHandler)
        .subscribe();

    return () => supabase.removeSubscription(subscription);
}

export async function getPollen(input) {
    const { data } = await supabase
        .from(`pollen`)
        .select("*")
        .match({ input });
    return data && data[0];
}

export function subscribePollenGenerator(input) {
    const channel = new Channel();
    subscribePollen(input, data => channel.push(data))
    return channel
}



// returnImmediately true means we don't wait for the pollen to be done if it was not finished yet
export async function dispatchAndReturnPollen(params, returnImmediately=false) {
    
        dispatchPollen(params);
        
        if (returnImmediately)
            return (await getPollen(params.input)).final_output;

        return await new Promise(async (resolve) => {
            await subscribePollen(params.input, ({final_output}) => final_output && resolve(final_output));
        });
}


// async function test() {
//     //console.log(await getAllPollens())
//     const input = "QmYdTVSzh6MNDBKMG9Z1vqfzomTYWczV3iP15YBupKSsM1"
//     const image = "614871946825.dkr.ecr.us-east-1.amazonaws.com/pollinations/majesty-diffusion-cog"
// //    console.log("dispatch", await dispatchPollen({input, image}))
// //    subscribePollen(input, res => console.log("res",res))

//     console.log("dispatchAndAwait", await dispatchAndReturnPollen({input, image}))
// }


// test()

