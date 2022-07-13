const util = require('util');
const crypto = require('crypto');

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

require('dotenv').config();

exports.signup = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}

	const email = req.body.email;
	const password = req.body.password;

	let randomToken;
	const randomBytes = util.promisify(crypto.randomBytes);

	randomBytes(20)
		.then((buffer) => {
			randomToken = buffer.toString('hex');
			return bcrypt.hash(password, 12);
		})
		.then((hashedPassword) => {
			//groupId is null when signing up
			const user = new User(randomToken, email, hashedPassword, null);
			return user.save();
		})
		.then((result) => {
			//201 -> resource created
			res.status(201).json({
				message: 'User created',
				userId: randomToken,
			});
		})
		.catch((err) => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});
};

exports.login = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let user;

	User.findByEmail(email)
		.then(([rows, data]) => {
			user = rows[0];
			return bcrypt.compare(password, user.password);
		})
		.then((isEqual) => {
			if (!isEqual) {
				const error = new Error('Wrong password!');
				error.statusCode = 401;
				throw error;
			}
			//creating jwt token
			const token = jwt.sign(
				{
					email: user.email,
					userId: user.userId,
				},
				process.env.jwt_secret,
				{ expiresIn: '24h' }
			);
			//in frontend we look for the user id and store it
			res.status(200).json({
				token: token,
				userId: user.userId,
			});
		})
		.catch((err) => {
			if (err.message === "Cannot read property 'email' of undefined") {
				console.log('cant find email');
				err.statusCode = 401;
				next(err);
			} else {
				if (err) {
					if (!err.statusCode) {
						err.statusCode = 500;
					}
					next(err);
				}
			}
		});
};

