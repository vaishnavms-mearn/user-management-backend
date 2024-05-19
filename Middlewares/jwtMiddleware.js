const jwt = require("jsonwebtoken");
const jwtMiddleware = (req, res, next) => {
  console.log("inside jwt middlware");
  //get the token from req header
  const token = req.headers["authorization"].slice(7);
  console.log(token);
  //token verification
  try {
    const tokenVerification =jwt.verify(token,"superkey2024")
    console.log(tokenVerification);
    req.payload=tokenVerification.userId
    next();
  } catch (err) {
    res.status(401).json("Authorization failed please login again");
  }
};
module.exports = jwtMiddleware;
