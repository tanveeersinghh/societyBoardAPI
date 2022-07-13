const util = require('util');
const crypto = require('crypto');

const { validationResult } = require('express-validator');

const Event = require('../models/event');
const User = require('../models/user');
const Group = require('../models/group');
const Society = require('../models/society');

const fs = require('fs');
const path = require('path');

exports.getEvents = (req, res, next) => {
	let groupId;
	let societyId;
	let events;
	let societyName;

	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				// The 401 (Unauthorized) status code indicates that the request has not been applied because it lacks valid authentication credentials for the target resource
				error.statusCode = 401;
				const error = new Error('The required userId does not exist');
				throw error;
			}

			groupId = rows[0].groupId;
			if (groupId === null) {
				// Page showing No society found or create society
				const error = new Error('No society created by the user');
				error.statusCode = 403;
				next(error);
			}

			return Group.findSocietyIdByGroupId(groupId);
		})
		.then(([rows, data]) => {
			societyId = rows[0].societyId;
			return Event.findEventsBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			events = rows;
			return Society.findSocietyNameBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			societyName = rows[0].societyName;
			res.status(200).json({
				message: 'Fetched events sucessfully',
				events: events,
				societyName: societyName,
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

//assuming rn that society and group are created
exports.createEvent = (req, res, next) => {
	let groupId;
	let loadedEvent;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect');
		error.statusCode = 422;
		throw error;
	}

	// if (!req.file) {
	// 	const error = new Error('No poster provided');
	// 	error.statusCode = 422;
	// 	throw err;
	// }

	const eventName = req.body.eventName;
	const poster = req.body.poster;
	const eventDesc = req.body.eventDesc;
	const startDate = req.body.startDate;
	const endDate = req.body.endDate;
	let website;
	let discord;
	let societyId;

	//we have req.userId available, now need to query db and find the societyId of the user who created event.
	//we have userId, need to find groupId of that user from users db, we can use the groupId to find societyId from groups db
	//Remember, we also need to fill groups db with dummy data, so that we can assume the groupId in user db is not null now

	// req.userId = 'fd29931b0ebfa36bf428e3ef07c6fd6ae76563b0';
	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			groupId = rows[0].groupId;
			return Group.findSocietyIdByGroupId(groupId);
		})
		.then(([rows, data]) => {
			societyId = rows[0].societyId;
			//find website and discord from society
			//TEST
			return Society.findWebsiteAndDiscordBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			website = rows[0].website;
			discord = rows[0].discord;
			
			const event = new Event(
				societyId,
				eventName,
				poster,
				eventDesc,
				startDate,
				endDate,
				website,
				discord
			);
			loadedEvent = event;
			return event.save();
		})
		.then((result) => {
			res.status(201).json({
				message: 'Event created',
				event: loadedEvent,
			});
		})
		.catch((err) => {
			if (
				err.message === "Cannot read property 'societyId' of undefined"
			) {
				console.log('Cant find societyId, db error');
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

exports.editEvent = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed, entered data is incorrect');
		error.statusCode = 422;
		// console.log(errors.array()[0].param);
		error.data = errors.array();
		throw error;
	}
	//getting eventId and societyId from post request (added to frontend when loading events)
	const eventId = req.body.eventId;
	const societyId = req.body.societyId;
	const eventName = req.body.eventName;
	const poster = req.body.poster;
	const eventDesc = req.body.eventDesc;
	const startDate = req.body.startDate;
	const endDate = req.body.endDate;
	const website = req.body.website;
	const discord = req.body.discord;
	let groupId;
	let event;

	if (req.file) {
		poster = req.file.path;
	}
	if (!poster) {
		const error = new Error('No poster picked');
		error.statusCode = 422;
		throw error;
	}

	Event.findEventById(eventId)
		.then(([rows, data]) => {
			//TEST
			event = rows[0];

			if (!event) {
				const error = new Error('Could not find event');
				error.statusCode = 404;
				next(error);
			}
			//if nothing retrieved from sql, internal error
			return Group.findGroupIdBySocietyId(societyId);
		})
		// if req.userId->groupId === event.societyId->groupId {true} else{return false msg}
		.then(([rows, data]) => {
			//event.societyId->groupId
			groupId = rows[0].groupId;
			// req.userId->groupId
			//if nothing retrieved from sql, internal error
			return User.findGroupIdByUserId(req.userId);
		})
		.then(([rows, data]) => {
			//checking if groupId of user who requested updation is equal to groupId of who created event
			if (groupId !== rows[0].groupId) {
				const error = new Error('Not authorized');
				error.statusCode = 403;
				next(error);
			}

			//means poster has changed
			if (poster !== event.poster) {
				//clear poster from server
				clearImage(event.poster);
			}

			return Event.update(
				eventId,
				eventName,
				poster,
				eventDesc,
				startDate,
				endDate,
				website,
				discord
			);
		})
		.then(([rows, data]) => {
			// console.log(rows);
			res.status(200).json({ message: 'Event updated!' });
		})
		.catch((err) => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			}
		});

	// if req.userId->groupId=== event.societyId->groupId {true} else{return false msg}
};

exports.deleteEvent = (req, res, next) => {
	const eventId = req.body.eventId;
	const societyId = req.body.societyId;
	let groupId;
	let event;

	Event.findEventByEventId(eventId)
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				const error = new Error('Could not find event');
				error.statusCode = 404;
				next(error);
			}
			event = rows[0];

			return Group.findGroupIdBySocietyId(societyId);
		})
		.then(([rows, data]) => {
			//catch block will catch the error
			if (rows.length <= 0) {
				error.statusCode = 500;
				const error = new Error('The required groupId does not exist');
				throw error;
			}
			//event.societyId->groupId
			groupId = rows[0].groupId;
			// req.userId->groupId
			//if nothing retrieved from sql, internal error
			return User.findGroupIdByUserId(req.userId);
		})
		.then(([rows, data]) => {
			if (rows.length <= 0) {
				error.statusCode = 500;
				const error = new Error('The required groupId does not exist');
				throw error;
			}

			//checking if groupId of user who requested updation is equal to groupId of who created event
			if (groupId !== rows[0].groupId) {
				const error = new Error('Not authorized');
				error.statusCode = 403;
				next(error);
			}

			return Event.findByEventIdAndRemove(eventId);
		})
		.then((result) => {
			if (result.affectedRows <= 0) {
				error.statusCode = 500;
				const error = new Error('Event did not get deleted');
				throw error;
			}
			// console.log('see proper err handling here too, what if no event was deleted? what will we receive in result?:', result);
			clearImage(event.poster);
			res.status(200).json({ message: 'Deleted Event.' });
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

//test krna hai ki agar website ya discord user ne nhi dala, to kya null hi receive hota hai backend ko? ya maybe kuch aisa ho jaye ki null in string receive ho jaye.. so test.
//also validate date somehow

exports.createSociety = (req, res, next) => {
	let groupId;
	//for the case when groupId is null (so a new society can be created), after creating a group, we need to store the groupId in loadedGroupId and add it in users db
	let loadedGroupId;
	let societyId;
	let user2Id;
	let user3Id;
	//add data to societies and groups db (also add groupid to users, add 2 new users as well)

	const societyName = req.body.societyName;
	//do req.file.logo later
	const logo = req.body.logo;
	const societyDesc = req.body.societyDesc;
	const dateEst = req.body.dateEst;
	const website = req.body.website;
	const discord = req.body.discord;
	let user1Email;
	const user2Email = req.body.user2Email;
	const user3Email = req.body.user3Email;
	let user2Password;
	let user3Password;

	if (req.file) {
		logo = req.file.logo;
	}
	if (!logo) {
		const error = new Error('No logo picked');
		error.statusCode = 422;
		throw error;
	}

	//authorization
	//check if groupId is null or not in users db
	User.findGroupIdByUserId(req.userId)
		.then(([rows, data]) => {
			//here we receive groupId as null, if userId is valid. but if userId is not a valid one, then we go to catch block.
			groupId = rows[0].groupId;
			//causing errors, that below code executing too
			if (groupId !== null) {
				const error = new Error(
					'Not allowed to create another society'
				);
				error.statusCode = 403;
				next(error);
			}

			return User.findEmailByUserId(req.userId);
		})
		.then(([rows, data]) => {
			//user1Email, to insert in groups db
			user1Email = rows[0].email;

			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			societyId = buffer.toString('hex');
			const society = new Society(
				societyId,
				societyName,
				logo,
				societyDesc,
				dateEst,
				website,
				discord
			);
			return society.save();
		})
		.then((result) => {
			const group = new Group(
				societyId,
				user1Email,
				user2Email,
				user3Email
			);
			return group.save();
		})
		.then((result) => {
			return Group.findGroupIdByUser1Email(user1Email);
		})
		.then(([rows, data]) => {
			loadedGroupId = rows[0].groupId;

			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user2Id = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user3Id = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user2Password = buffer.toString('hex');
			const randomBytes = util.promisify(crypto.randomBytes);
			return randomBytes(20);
		})
		.then((buffer) => {
			user3Password = buffer.toString('hex');

			//saving user2 and user3 in users db
			//BUG DIDNT FIND GROUPID

			const user2 = new User(
				user2Id,
				user2Email,
				user2Password,
				loadedGroupId
			);
			return user2.save();
		})
		.then((result) => {
			const user3 = new User(
				user3Id,
				user3Email,
				user3Password,
				loadedGroupId
			);
			return user3.save();
		})
		.then((result) => {
			//inserting groupId also in 1st user's row in users db

			User.insertGroupIdInUser1(loadedGroupId, req.userId);
		})
		.then((result) => {
			res.status(201).json({
				message: 'Society created successfully (plus other things)',
			});
		})
		.catch((err) => {
			//findGroupIdByUserId error
			if (err.message === "Cannot read property 'groupId' of undefined") {
				const error = new Error(
					'You are not allowed to access the resource'
				);
				err.statusCode = 403;
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

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => {
		if (err) {
			console.log('err in unlink in clearImage:', err);
		}
		// console.log('err in unlinddk in clearImage in feed.js:', err);
	});
};
