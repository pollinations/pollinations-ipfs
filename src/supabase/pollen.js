import supabase from "./client.js";
import { Channel } from 'queueable';
import Debug from 'debug';

const debug = Debug("supabasePollen");

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

export function updatePollen(input, output) {
    return supabase
            .from("pollen")
            .update({
                output
            })
            .eq("input", input)
            .then(({data}) => data);
}

// subscribe to 
export async function subscribePollen(input, callback) {

    debug("getting first pollen using select", input)
    const data = await getPollen(input);
    debug("got data",data)
    if (data) {
        callback(data);
        
        // return if job was already done
        if (data.success === true)
            return () => null;
    }

    
    const subscriptionHandler = ({new:data}) => { 
        debug("subscriptionHandler", data);
        callback(data);
        if (data.success === true) {
            supabase.removeSubscription(subscription)
        }
    }

    debug("subscribing to,",`pollen:input.eq.${input}`)
    const subscription = supabase
        .from(`pollen`)//:input.eq.${input}`)
        .on("UPDATE", subscriptionHandler)
        //.on("INSERT", subscriptionHandler)
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

export function dispatchPollenGenerator(input) {
    dispatchPollen()
    const channel = new Channel();
    subscribePollen(input, data => channel.push(data))
    return channel
}



// returnImmediately true means we don't wait for the pollen to be done if it was not finished yet
export async function dispatchAndReturnPollen(params, returnImmediately=false) {
        debug("disopathing pollen", params);
        dispatchPollen(params);
        
        if (returnImmediately)
            return (await getPollen(params.input)).output;

        return await new Promise(async (resolve) => {
            await subscribePollen(params.input, ({output, success}) => success === true && resolve(output));
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



// const allPollen = await getAllPollens();

// for (const pollen of allPollen) {
//    try {
//     const parsedPollen = JSON.parse(pollen.output);
//     let val = null;
//     if (Array.isArray(parsedPollen)) {
//         // pollen is last pollen
//         val = parsedPollen[parsedPollen.length - 1];
//     }
//     else {
//         val = parsedPollen;
//     }

//     await supabase.from("pollen").update({"output": val}).match({input:pollen.input});
//     //console.log("changing pollen to", val);

//    } catch (e) {
//     console.log("could not parse",pollen.output)
//    }
// }