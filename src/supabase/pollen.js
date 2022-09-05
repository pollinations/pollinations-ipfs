import Debug from 'debug';
import { Channel } from 'queueable';
import supabase from "./client.js";

const debug = Debug("pollen");

// DB Name should be "pollen" if environment is production else "pollen_dev"

const DB_NAME = process.env.POLLINATIONS_ENV === "development" ? "pollen_dev" : "pollen";


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
    debug("updatePollen", input, data)
    return supabase
            .from(DB_NAME)
            .update(data)
            .eq("input", input)
            .then(({data}) => data);
}

// subscribe to 
export async function subscribePollen(input, callback) {

    debug("getting first pollen using select", input)
    
    let lastData = null;
    const getData = async () => {
        const data = await getPollen(input);
        debug("data", data);
        if (data && (JSON.stringify(data) !== JSON.stringify(lastData))) {
            lastData = data;
            callback(data);

            // return if job was already done
            if (data.success !== null)
                clearInterval(interval);
        }
    };


    const interval = setInterval(getData, 1000)
    getData();
    
    return () => clearInterval(interval);
}

export async function getPollen(input) {
    const { data } = await supabase
        .from(DB_NAME)
        .select("*")
        .match({ input });
    return data && data[0];
}

export async function dispatchPollenGenerator(params) {
    await dispatchPollen(params)
    const channel = new Channel();
    subscribePollen(params.input, data => data.output && channel.push(data.output))
    
    return channel
}



// returnImmediately true means we don't wait for the pollen to be done if it was not finished yet
export async function dispatchAndReturnPollen(params, returnImmediately=false) {
        debug("disopathing pollen", params);
        dispatchPollen(params);
        
        if (returnImmediately)
            return (await getPollen(params.input))?.output;

        return await new Promise(async (resolve, reject) => {
            await subscribePollen(params.input, ({output, success}) => ((success === true) && resolve(output)) || ((success === false) && reject(output)));
        });
}

// await sleep(1000)
// console.log("pollen", await getPollens({image: "614871946825.dkr.ecr.us-east-1.amazonaws.com/pollinations/stable-diffusion-private", success: true}))
// async function test() {
//    //console.log(await getAllPollens())
//     const input = "QmYdTVSzh6MNDBKMG9Z1vqfzomTYWczV3iP15YBupKSsM1"
//     const image = "614871946825.dkr.ecr.us-east-1.amazonaws.com/pollinations/majesty-diffusion-cog"
// //    console.log("dispatch", await dispatchPollen({input, image}))
// //    subscribePollen(input, res => console.log("res",res))

//     console.log("dispatchAndAwait", await dispatchAndReturnPollen({input, image}))
// }


// test()
// subscribePollen("QmX3SZ1Hqev1p7kvubXZA7Zua87D9QJEVsRJzBz15v3iSv", data => console.log("data", data))


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