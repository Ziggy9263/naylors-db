const admin = require("firebase-admin");

module.exports = validateFirebaseIdToken = async (req, res, next) => {
	// Check if request is authorized with Firebase ID token.
	if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
		!(req.cookies && req.cookies.__session)) {
		// No Firebase ID token was passed as Bearer token.
		res.status(403).send('Unauthorized, Validating Token Failed');
		return;
	}

	// Parse Bearer Token.
	let idToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		// Read ID Token from Auth header.
		idToken = req.headers.authorization.split('Bearer ')[1];
	} else if (req.cookies) {
		// Read ID from cookie.
		idToken = req.cookies.__session;
	} else {
		// No cookie.
		res.status(403).send('Unauthorized, Validating Token Failed');
		return;
	}

	// Verify Token with Firebase.
	try {
		const decodedIdToken = await admin.auth().verifyIdToken(idToken);
		req.auth = decodedIdToken;
		next();
		return;
	} catch (error) {
		res.status(403).send('Unauthorized, Validating Token Failed, ' + error.toString());
		return;
	}
};
