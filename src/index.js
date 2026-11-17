
const readline = require("readline");

const Database = require("./database");
const parse = require("./parser");

const db = new Database();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "redis> "
});

function execute(command, args) {
    switch (command) {
        case "SET":
            if (args.length < 2) return "ERR wrong number of arguments";
            return db.set(args[0], args.slice(1).join(" "));

        case "GET":
            if (args.length !== 1) return "ERR wrong number of arguments";
            return db.get(args[0]) ?? "(nil)";

        case "DEL":
            if (args.length !== 1) return "ERR wrong number of arguments";
            return db.del(args[0]);

        case "EXISTS":
            if (args.length !== 1) return "ERR wrong number of arguments";
            return db.exists(args[0]);

        case "KEYS":
            if (args.length !== 0) return "ERR wrong number of arguments";
            return db.keys();

        case "FLUSHALL":
            if (args.length !== 0) return "ERR wrong number of arguments";
            return db.flushAll();

        case "EXIT":
            rl.close();
            return null;

        
        case "EXPIRE":
                if (args.length !== 2) return "ERR wrong number of arguments";
                if (!Number.isInteger(Number(args[1])) || Number(args[1]) < 0) {
                return "ERR invalid expiration time";
            }
        return db.expire(args[0], Number(args[1]));

        case "TTL":
            if (args.length !== 1) return "ERR wrong number of arguments";
            return db.ttl(args[0]);


        default:
            return "(error) unknown command";
    }
}

rl.prompt();

rl.on("line", (input) => {
    if (!input.trim()) {
        rl.prompt();
        return;
    }

    const { command, args } = parse(input);

    const result = execute(command, args);

    if (result !== null) {
        console.log(result);
    }

    if (command !== "EXIT") {
        rl.prompt();
    }
});

rl.on("close", () => {
    console.log("RedisLite shutting down...");
    process.exit(0);
});
