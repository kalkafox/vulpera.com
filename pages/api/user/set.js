import { getMongoClient } from "/js/mongo";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("❌  Method not allowed");
    return;
  }
  const client = getMongoClient();
  await client.connect();
  const db = client.db("vulpera");
  const collection = db.collection("users");
  const user = await collection.findOne({
    fingerprint: req.headers["x-fingerprint"],
  });
  if (user != null) {
    res.status(403).send("❌  User already exists");
    return;
  }
  await collection.insertOne(JSON.parse(req.body));
  await client.close();
  res.status(200).json({ message: "Successfully set from the system." });
};

export default handler;
