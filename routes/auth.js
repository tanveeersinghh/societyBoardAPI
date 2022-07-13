const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../middleware/is-auth');
const authController = require('../controllers/auth');

const router = express.Router();

//PUT /auth/signup
router.put(
	'/signup',
	[
		//Add custom validator to see if email already exists
		body('email')
			.isEmail()
			.withMessage('Please Enter a valid email')
			.normalizeEmail()
			.isLength({ max: 50 }),
		body('password').trim().isLength({ min: 5, max: 50 }),
	],
	authController.signup
);

//POST /auth/login
router.post('/login', authController.login);

module.exports = router;
