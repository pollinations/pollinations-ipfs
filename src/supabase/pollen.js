import supabase from "./client.js";
import { Channel } from 'queueable';
import Debug from 'debug';

const debug = Debug("pollen");

const DB_NAME = "pollen";

let subscribers = {};

   
const subscriptionHandler = ({new:data}) => { 
     Object.keys(subscribers).forEach(input => {
        if (data.input !== input) {
            //debug("ignoring pollen", data.input, input)
            return;
        }

        debug("subscriptionHandler", data);
        
        if (data.output) {
            subscribers[input](data);
        }

        if (data.success !== null) {
            delete subscribers[input];
        }
    })
}


const subscription = supabase
    .from(DB_NAME)
    .on("UPDATE", subscriptionHandler)
    //.on("INSERT", subscriptionHandler)
    .subscribe();

export async function getPollens(params) {
    const { data } = await supabase
        .from(DB_NAME)
        .select("*")
        .match(params);
    return data;
}

export function dispatchPollen(params) {
    return supabase
            .from(DB_NAME)
            .insert(params)
            .then(({data}) => data);
}

export function updatePollen(input, data) {
    return supabase
            .from(DB_NAME)
            .update(data)
            .eq("input", input)
            .then(({data}) => data);
}

// subscribe to 
export async function subscribePollen(input, callback) {

    debug("getting first pollen using select", input)
    const data = await getPollen(input);
    debug("data",data)
    if (data) {
        callback(data);
        
        // return if job was already done
        if (data.success === true)
            return () => null;
    }

    subscribers[input] = callback;

    return () => subscribers.delete(input);
}

export async function getPollen(input) {
    const { data } = await supabase
        .from(DB_NAME)
        .select("*")
        .match({ input });
    return data && data[0];
}

export async function dispatchPollenGenerator(input) {
    await dispatchPollen(input)
    const channel = new Channel();
    subscribePollen(input.input, data => data.output && channel.push(data.output))
    
    return channel
}



// returnImmediately true means we don't wait for the pollen to be done if it was not finished yet
export async function dispatchAndReturnPollen(params, returnImmediately=false) {
        debug("disopathing pollen", params);
        dispatchPollen(params);
        
        if (returnImmediately)
            return (await getPollen(params.input))?.output;

        return await new Promise(async (resolve, reject) => {
            await subscribePollen(params.input, ({output, success}) => success === true ? resolve(output) : reject(output));
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