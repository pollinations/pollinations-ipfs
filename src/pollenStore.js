import db from "./supabase/client.js";


const store = name => {
  
    const get = async key => {
        const {data, error } = await db.from(name).select("value").match({ key });
        if (error)
            console.error(error);
        return data[0]?.value;
    }

    const set = async (key, value) => {
        return (await db.from(name).upsert({ key, value })).data[0];
    }

    return {
        get, set
    }
}

export default store;