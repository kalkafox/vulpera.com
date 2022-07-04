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
  if (!user || user === null) {
    res.status(403).send("❌  User not found");
    return;
  }
  await collection.deleteOne({ fingerprint });
  console.log("Successfully deleted.");
  await client.close();
  res.json({ message: "Successfully deleted from the system." });
  console.log("Disconnected from mongo");
};

export default handler;
