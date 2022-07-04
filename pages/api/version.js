import packageData from "../../package.json";

const handler = (req, res) => {
  res.status(200).json({
    version: packageData.version,
  });
};

export default handler;
