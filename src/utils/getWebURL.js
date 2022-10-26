const getWebURL = (cid, name = null) => {
    const filename = name ? `?filename=${name}` : '';
    return `https://store.pollinations.ai/ipfs/${cid.toString()}${filename}`
};

export default getWebURL;