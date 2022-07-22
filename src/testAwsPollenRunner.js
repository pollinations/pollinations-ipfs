import runModelOnce from "./awsPollenRunner";


async function test() {
    const output = await runModelOnce({ prompt: "Where is my mind?" }, "voodoohop/dalle-playground");
    console.log(output);
}
  
test()