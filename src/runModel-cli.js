import runModel from "./awsModelRunner";

// first argument is model name, second inputs

const [, , model, inputsString, isDevString] = process.argv;

const isDev = isDevString === "DEV";

const inputs = JSON.parse(inputsString);

async function run(model, inputs) {
  const imageUrl = await runModel(inputs, model, isDev);
  console.log(imageUrl);
}

run(model, inputs)