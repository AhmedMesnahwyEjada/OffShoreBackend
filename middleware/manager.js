module.exports = (req, res, next) => {
  const token = req.userToken;
  if (token === "Employee") return res.status(403).send("Access denied");
  next();
};
