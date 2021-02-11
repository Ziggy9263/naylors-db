const User = require('../user/user.model');

module.exports = appendUser = async (req, res, next) => {
  let auth = req.auth;
  let user = User.get({uid: auth.uid}).then(doc => doc).catch(e => res.status(403).send('Unauthorized'));
  req.user = user;
  next();
  return;
};
