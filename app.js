const path = require('path');

const db = require('./util/database');
const express = require('express');
const multer = require('multer');

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const User = require('./models/user');
const Group = require('./models/group');
const Event = require('./models/event');
const Society = require('./models/society');

const PORT = 8080;

const app = express();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	},
});
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(express.json());
app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization'
	);

	next();
});

app.use(homeRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	//data passed in case of validation errors
	const data = error.data;
	res.status(status).json({
		message: message,
		data: data,
	});
});

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

process.on('SIGINT', () => {
	console.log('\nShutting down');
	process.exit(1);
});

// Group.findsocietyIdByGroupId(78)
// 	.then(([rows, data]) => {
// 		console.log(rows[0].societyId);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// const groupId = 5;
// const test = db.execute('SELECT * FROM `society-board`.groups WHERE groups.groupId = 5', [
// 	groupId,
// ]);

// test.then((result) => {
// 	console.log(result[0]);
// }).catch((err) => {
// 	console.log(err);
// });

// Event.findEventById(3)
// 	.then(([rows, data]) => {
// 		const event = rows[0];

// 		if (!event) {
// 			console.log('yo');
// 		}
// 		console.log(rows);
// 		// console.log(event.poster);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// User.findGroupIdByUserId('ce14290ea7e15e0b0fa643e6f73f04dc86d276a5').then(([rows, data]) => {
// 	if (rows.length == 0) {
// 		console.log('this is');
// 	}
// 	else {
// 		console.log('that is');
// 	}
// 	// console.log(rows);

// }).catch((err) => {
// 	console.log(err);
// });

// const id = 'fd29931b0ebfa36bf428e3ef07c6fd6ae76563b0'

// User.findEmailByUserId(id).then(([rows, data]) => {
// 	console.log(rows[0].email);
// }).catch((err) => {
// 	console.log(err);
// });

// Group.findGroupIdByUser1Email('adiad')
// 	.then(([rows, data]) => {
// 		console.log(rows[0].groupId);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Event.findEventByEventId(5)
// 	.then(([rows, data]) => {
// 		const event = rows[0]
// 		console.log(event);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Group.findGroupIdBySocietyId('78dd0813f9d7e2c22c43baeed45df82d967f981').then(([rows, data]) => {
// 	if (!rows.length) {
// 		console.log('hii');
// 	}
// 	else {
// 		console.log('yooo');
// 	}
// 	console.log(rows);
// }).catch((err) => {
// 	console.log(err);
// });

// Event.findByEventIdAndRemove(3).then((result) => {
// 	console.log(result);
// }).catch((err) => {
// 	console.log(err);
// });

// Society.findWebsiteAndDiscordBySocietyId(
// 	'78dd0813f9d7e2c22c43baeed45df82d967f9812'
// )
// 	.then(([rows, data]) => {
// 		console.log(rows[0]);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// Event.findEventsBySocietyId('78dd0813f9d7e2c22c43baeed45df82d967f9812').then(([rows, data]) => {
// 	console.log(rows);
// }).catch((err) => {
// 	console.log(err);
// })

// Event.displayAllEvents().then(([rows, data]) => {
// 	let date = new Date(rows[1].startDate);
// 	console.log(rows[1]);
// 	console.log(date.getUTCDate());
// }).catch((err) => {
// 	console.log(err);
// });