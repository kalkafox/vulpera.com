import { getMongoClient } from "/js/mongo";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("❌  Method not allowed");
    return;
  }
  const data = JSON.parse(req.body);
  if (data.name === "oiku") {
    res.status(403).send("❌  Forbidden");
    return;
  }
  if (
    !data ||
    data === null ||
    !data.fingerprint ||
    data.fingerprint === null ||
    !data.name ||
    data.name === null
  ) {
    res.status(403).send("❌  Missing data");
    return;
  }
  const client = getMongoClient();
  await client.connect();
  const db = client.db("vulpera");
  const collection = db.collection("users");
  const user = await collection.findOne({
    name: data.name,
  });

  if (user != null) {
    res.status(200).json({
      message:
        "It seems another individual is already registered to this system. We greatly apologize for the inconvenience.\r\nPlease, re-attempt your request with another name, and try again.",
    });
    return;
  }
  await collection.insertOne(JSON.parse(req.body));
  await client.close();
  res.status(200).json({ message: "Successfully set from the system." });
};

export default handler;
