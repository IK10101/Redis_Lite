
const fs = require("fs");
const path = require("path");

class Database {
    constructor() {
        this.store = new Map();

        this.filePath = path.join(__dirname, "../data/database.json");

        fs.mkdirSync(path.dirname(this.filePath), {
            recursive: true
        });

        this.load();
    }

    // Load database from disk
    load() {
        if (!fs.existsSync(this.filePath)) return;

        try {
            const data = JSON.parse(
                fs.readFileSync(this.filePath, "utf8")
            );

            this.store = new Map(data);
        } catch (error) {
            console.log("Could not load database:", error.message);
        }
    }

    // Save database to disk
    save() {
        const data = JSON.stringify([...this.store]);

        fs.writeFileSync(this.filePath, data);
    }

    // SET
    set(key, value) {
        this.store.set(key, {
            value,
            expiry: null
        });

        this.save();
        return "OK";
    }

    // GET
    get(key) {
        if (!this.store.has(key)) return null;

        const entry = this.store.get(key);

        if (entry.expiry !== null && Date.now() >= entry.expiry) {
            this.store.delete(key);
            this.save();
            return null;
        }

        return entry.value;
    }

    // DEL
    del(key) {
        this.get(key);

        const result = this.store.delete(key);

        if (result) this.save();

        return result ? 1 : 0;
    }

    // EXISTS
    exists(key) {
        return this.get(key) !== null ? 1 : 0;
    }

    // EXPIRE
    expire(key, seconds) {
        if (this.get(key) === null) return 0;

        this.store.get(key).expiry = Date.now() + seconds * 1000;

        this.save();
        return 1;
    }

    // TTL
    ttl(key) {
        if (this.get(key) === null) return -2;

        const expiry = this.store.get(key).expiry;

        if (expiry === null) return -1;

        return Math.max(
            0,
            Math.ceil((expiry - Date.now()) / 1000)
        );
    }

    // KEYS
    keys() {
        const result = [];

        for (const key of this.store.keys()) {
            if (this.get(key) !== null) {
                result.push(key);
            }
        }

        return result;
    }

    // FLUSHALL
    flushAll() {
        this.store.clear();
        this.save();

        return "OK";
    }

    // RPUSH
    rpush(key, value) {
        this.get(key); // Clean up expired key if necessary

        if (!this.store.has(key)) {
            this.store.set(key, {
                value: [],
                expiry: null
            });
        }

        const list = this.store.get(key).value;

        if (!Array.isArray(list)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        list.push(value);

        this.save();

        return list.length;
    }

    // LPUSH
    lpush(key, value) {
        this.get(key); // Clean up expired key if necessary

        if (!this.store.has(key)) {
            this.store.set(key, {
                value: [],
                expiry: null
            });
        }

        const list = this.store.get(key).value;

        if (!Array.isArray(list)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        list.unshift(value);

        this.save();

        return list.length;
    }


    lpop(key) {
        const value = this.get(key);

        if (value === null) return null;

        if (!Array.isArray(value)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        const result = value.shift();

        // Remove key if list becomes empty
        if (value.length === 0) {
            this.store.delete(key);
        }

        this.save();

        return result;
    }

    rpop(key) {
        const value = this.get(key);

        if (value === null) return null;

        if (!Array.isArray(value)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        const result = value.pop();

        // Remove key if list becomes empty
        if (value.length === 0) {
            this.store.delete(key);
        }

        this.save();

        return result;
    }


    llen(key) {
        const value = this.get(key);

        if (value === null) return 0;

        if (!Array.isArray(value)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        return value.length;
    }


    lrange(key, start, stop) {
        const value = this.get(key);

        if (value === null) return [];

        if (!Array.isArray(value)) {
            return "WRONGTYPE Operation against a key holding the wrong kind of value";
        }

        const length = value.length;

        // Convert negative indexes
        if (start < 0) start = length + start;
        if (stop < 0) stop = length + stop;

        // Handle out-of-range indexes
        start = Math.max(0, start);
        stop = Math.min(length - 1, stop);

        if (start >= length || start > stop) {
            return [];
        }

        return value.slice(start, stop + 1);
    }

}

module.exports = Database;


