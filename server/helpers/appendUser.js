const User = require('../user/user.model');

module.exports = appendUser = async (req, res, next) => {
  let auth = req.auth;
  try {
    let user = await User.get({'uid': auth.uid})
    req.user = user;
    next();
    return;
  } catch (e) {
    res.status(403).send('Unauthorized, ' + e.toString());
    return;
  }
};
