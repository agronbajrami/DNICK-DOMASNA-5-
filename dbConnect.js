const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect(
        "mongodb+srv://agronbajrami:testmongo@cluster0.5vkroic.mongodb.net/?retryWrites=true&w=majority"
    )
        .then((client) => {
            console.log("Connected!");
            _db = client.db();
            callback();
        })
        .catch((err) => {
            console.log(err);
        });
};
const getDb = () => {
    if (_db) {
        return _db;
    }
    throw "No database found";
};
module.exports.mongoConnect = mongoConnect;
module.exports.getDb = getDb;