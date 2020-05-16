const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const ca = require('chalk-animation');
const helpers = require('./helpers');
const firebase = require("firebase/app");
const fbstorage = require("firebase/storage");

const uidSafe = require('uid-safe');

const app = express();

const diskStorage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, __dirname + '/uploads/');
	},
	filename: function (req, file, callback) {
		uidSafe(24).then(function (uid) {
			// callback(null, uid + path.extname(file.originalname));
			callback(null, uid + file.originalname);
		});
	},
});
// =====   Firebase ======
const firebaseConfig = {
	apiKey: "AIzaSyAsm4D-3VvEB1hcOdH9_q0Hpqjy9LbpD8A",
	authDomain: "whatever-images.firebaseapp.com",
	databaseURL: "https://whatever-images.firebaseio.com",
	projectId: "whatever-images",
	storageBucket: "whatever-images.appspot.com",
	messagingSenderId: "264508170025",
	appId: "1:264508170025:web:26a7a71857c6cd04ab2138"
};
firebase.initializeApp(firebaseConfig);
// =====   Firebase ======

const uploader = multer({
	storage: diskStorage,
	fileFilter: helpers.imageFilter,
	limits: {
		fileSize: 2097152,
	},
});

app.use(bodyParser.json());
app.use(express.static('./public'));
app.use(express.static('./public/uploads'));

app.get('/', (req, res) => {
	res.redirect('/images');
});

app.get('/images', (req, res) => {
	db.getImages()
		.then((data) => {
			res.json(data.rows.reverse());
		})
		.catch((err) => {
			console.log('Error in get images:', err);
		});
});

app.get('/image/:id', (req, res) => {
	db.getImageInfo(req.params.id).then((results) => {
		res.json(results.rows);
	});
});

// app.post('/upload', (req, res) => {
app.post('/upload', uploader.single('file'), (req, res) => {

	if (req.file == undefined) {
		res.status(400).send({
			error: 'image is missing'
		});
		return;
	} else {
		const url = req.body.imageUrl;
		const username = req.body.username;
		const title = req.body.title;
		const description = req.body.description
		db.addImage(url, username, title, description)
			.then(({
				rows
			}) => {
				res.json(rows[0]);
			})
			.catch((err) => {
				console.log('err in post upload:', err);
				return next(err);
			});
	}
});

app.post('/comments/:id', (req, res) => {
	db.addComment(req.body.comment, req.body.username, req.body.id)
		.then((results) => {
			res.json(results.rows);
		})
		.catch((err) => {
			console.log('Error in Post Comments/:id: ', err);
		});
});

app.get('/comments/:id', (req, res) => {
	db.getImageComments(req.params.id).then((results) => {
		res.json(results.rows);
	});
});

app.post('/delete', (req, res) => {
	console.log('Delete req.body', req.body);
	db.deleteImage(req.body.id)
		.then((result) => {})
		.catch((err) => {
			console.log(err.message);
		});
});

app.listen(process.env.PORT || 8080, () => console.log('THE ENVIRONMENT VARS ARE: ', process.env), console.log('Yo, I am listening on 8080'));