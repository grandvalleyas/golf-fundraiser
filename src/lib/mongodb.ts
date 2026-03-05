import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;

if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(uri).connect();
}

export async function connectToDatabase(dbName = "golf_fundraiser_2026") {
  const client = await global._mongoClientPromise!;
  const db = client.db(dbName);
  return { db, client };
}
