const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('rental');
const collection = db.collection('house');

async function main() {
    try {
    await db.command({ ping: 1 });
    console.log(`DB connected to ${config.hostname}`);
    } catch (ex) {
    console.log(`Error with ${url} because ${ex.message}`);
    process.exit(1);
    }

    try {
        await collection.updateMany({beds: { $gte: 1 }}, { $set: { beds: 2 } });

    // try {
    //    const house = {
    //  name: 'shack by the beach',
    //  summary: 'From your bedroom to the beach, no shoes required',
    //  property_type: 'Shack',
    //  beds: 300,
    // };

    // const insertResult = await collection.insertOne(house);
    // const query = { property_type: 'Condo', beds: { $lt: 2 } };
    // const options = {
    //     sort: { score: -1 },
    //     limit: 10,
    // };
    // const cursor = collection.find(query, options);
    // const rentals = await cursor.toArray();
    // rentals.forEach((i) => console.log(i));

    } finally {
    client.close();
    }
}

main();