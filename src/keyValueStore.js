import Debug from "debug";
import db from "./supabase/client.js";

const debug = Debug("pollenStore");

const store = name => {
  
    let lastValue = null;
    const get = async key => {
        const {data, error } = await db.from(name).select("value").match({ key });
        if (error)
            console.error(error);
        if (data.length === 0)
            return null;
        return JSON.parse(data[0]?.value);
    }

    const set = async (key, value) => {
        debug("publishing", key, value);
        lastValue = value;
        return (await db.from(name).upsert({ key, value: JSON.stringify(value) }).select("*")).data[0];
    }

    const subscribe = (key, callback) => {
            const res = db.channel(`public:${name}`).on("postgres_changes", 
            { event: '*', schema: 'public', table: name },
            payload => {
                // console.log({payload})
                if (payload.new.key === key) {
                    const newValue = payload.new.value;
                    if (newValue !== lastValue) {
                        debug("got new value", newValue, "for key", key);
                        callback(payload.new.value);
                    }
                }
            }).subscribe();
            
            get(key).then(key => key && callback(key));

            return () => db.removeChannel(res);
    }

    return {
        get, set, subscribe
    }
}

export default store;



// (async () => {
//     const s = store("colab_nodes");
//     const unsubscribe = s.subscribe("test", (...args) =>console.log(...args));
//     await awaitSleep(1000);
//     await s.set("test", "hello1");
//     await awaitSleep(500);
//     await s.set("test", "hello2");
//     await awaitSleep(1000);
//     console.log("unsubscribing")
//     unsubscribe()
// })();
