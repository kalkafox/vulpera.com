const handler = async (req, res) => {
  let url = "";
  if (req.headers.url.includes("http")) {
    url = req.headers.url;
  } else {
    url = "http://" + req.headers.url;
  }

  const r = await fetch(url);
  res.status(200).send(await r.text());
};

export default handler;
