import { getMongoClient } from "/js/mongo";

const handler = async (req, res) => {
  const fingerprint = req.headers["x-fingerprint"];
  if (!fingerprint || fingerprint === null) {
    res.status(403).send("❌  Missing fingerprint");
    return;
  }
  const client = getMongoClient();
  await client.connect();
  const db = client.db("vulpera");
  const collection = db.collection("users");
  const user = await collection.findOne({ fingerprint });
  await client.close();
  if (!user || user === null) {
    res.status(403).send("❌  User not found");
    return;
  }
  res.json({ name: user.name });
  console.log("Disconnected from mongo");
};

export default handler;
