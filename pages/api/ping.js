const ping = (req, res) => {
  res.json({ num: Math.random() });
};

export default ping;
