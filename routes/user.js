const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../middleware/is-auth');
const userController = require('../controllers/user');

const router = express.Router();

//GET /user/events
router.get('/events', isAuth, userController.getEvents);

//POST /user/createEvent
router.post(
	'/createEvent',
	isAuth,
	[
		body('eventName').trim().isLength({ min: 5, max: 50 }),
		body('eventDesc').trim().isLength({ min: 10, max: 500 }),
		body('website').trim().isLength({ max: 100 }),
		body('discord').trim().isLength({ max: 100 }),
	],
	userController.createEvent
);

//PUT /user/editEvent
router.put(
	'/editEvent',
	isAuth,
	[
		body('eventId').isLength({min: 1}),
		body('eventName').trim().isLength({ min: 5, max: 50 }),
		body('eventDesc').trim().isLength({ min: 10, max: 500 }),
		body('website').trim().isLength({ max: 100 }),
		body('discord').trim().isLength({ max: 100 }),
	],
	userController.editEvent
);

//POST /user/createSociety (cuz delete doesnt have body, we dont wanna pass id in params)
router.post('/deleteEvent', isAuth, userController.deleteEvent);

//POST /user/createSociety
router.post('/createSociety', isAuth, userController.createSociety);

module.exports = router;
