const Url = require("url-parse");
const c = require("ansi-colors");

const domains = ["wttr.in", "cheat.sh", "rate.sx"];

const handler = async (req, res) => {
  let url = new Url(`https://${req.headers.url}`, true);

  if (domains.includes(url.host)) {
    let domain = url.hostname;
    let path = url.pathname;
    let query = url.query;

    let response = await fetch(`https://${domain}${path}?${query}`);
    let body = await response.text();
    res.write(body);
    res.end();
  } else {
    const filteredDomains = [...domains];
    const last = filteredDomains.pop();
    res
      .status(403)
      .send(
        `❌  Sorry, but only these domains are allowed: ${c.cyan(
          filteredDomains.join(", ")
        )} or ${c.cyan(last)}`
      );
  }

  console.log(url);
};

export default handler;
