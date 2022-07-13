const jwt = require('jsonwebtoken');

require('dotenv').config();

module.exports = (req, res, next) => {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Not Authenticated');
		error.statusCode = 401;
		throw error;
	}

	const token = authHeader.split(' ')[1];
	let decodedToken;
	//trying to decode the token (could fail ???), so adding try catch
	try {
		//will decode and verify the token
		decodedToken = jwt.verify(token, process.env.jwt_secret);
	} catch (err) {
		err.statusCode = 500;
		throw err;
	}
	//will be undefined if it wasnt verified
	if (!decodedToken) {
		const error = new Error('Not Authenticated');
		error.statusCode = 401;
		throw error;
	}

	//now we have a valid decoded token

	req.userId = decodedToken.userId;
	next();
};
