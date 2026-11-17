
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

    save() {
        const data = JSON.stringify([...this.store]);

        fs.writeFileSync(this.filePath, data);
    }

    set(key, value) {
        this.store.set(key, {
            value,
            expiry: null
        });

        this.save();
        return "OK";
    }

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

    del(key) {
        this.get(key);

        const result = this.store.delete(key);
        if (result) this.save();

        return result ? 1 : 0;
    }

    exists(key) {
        return this.get(key) !== null ? 1 : 0;
    }

    expire(key, seconds) {
        if (this.get(key) === null) return 0;

        this.store.get(key).expiry = Date.now() + seconds * 1000;

        this.save();
        return 1;
    }

    ttl(key) {
        if (this.get(key) === null) return -2;

        const expiry = this.store.get(key).expiry;

        if (expiry === null) return -1;

        return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
    }

    keys() {
        const result = [];

        for (const key of this.store.keys()) {
            if (this.get(key) !== null) result.push(key);
        }

        return result;
    }

    flushAll() {
        this.store.clear();
        this.save();

        return "OK";
    }
}

module.exports = Database;
