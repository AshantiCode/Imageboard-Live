new Vue({
	el: '#main',
	data: {
		errorDialog: null,
		errorText: '',
		maxSize: 1024,
		imageId: '',
		images: [],
		form: {
			title: '',
			username: '',
			description: '',
			file: null,
		},
	},
	created() {
		firebase.initializeApp({
			apiKey: "AIzaSyAsm4D-3VvEB1hcOdH9_q0Hpqjy9LbpD8A",
			authDomain: "whatever-images.firebaseapp.com",
			databaseURL: "https://whatever-images.firebaseio.com",
			projectId: "whatever-images",
			storageBucket: "whatever-images.appspot.com",
			messagingSenderId: "264508170025",
			appId: "1:264508170025:web:26a7a71857c6cd04ab2138"
		});
	},

	props: {
		// Use "value" to enable using v-model
		value: Object,
	},

	mounted: function () {
		var self = this;

		axios.get('/images').then(function (res) {
			// console.log('Res in /images', res);
			self.images = res.data;
		});
	},
	methods: {
		getId: function (imageId) {
			this.imageId = imageId;
		},
		closeModal: function () {
			this.imageId = null;
		},

		updateImage: function (data) {
			let self = this;
			const index = self.images.findIndex(function (result) {
				return result.id === data.id;
			});
			this.images.splice(index, 1);
		},

		toggleErrMsg: function (e) {
			let chooseFile = document.getElementById('file');
			const errMsg = document.querySelector('.subheading');
			document.querySelector('.subheading').style.display = 'none';
		},

		uploadFile: function (e) {

			const storage = firebase.storage()
			const storageRef = storage.ref()
			const file = document.getElementById('file');
			const uploadedFile = file.files[0];

			// Check
			if (!uploadedFile) {
				this.errorDialog = true;
				this.errorText = 'Please choose an image file';
			} else {
				this.toggleErrMsg();
				const name = new Date() + '-' + uploadedFile.name

				async function fireBaseUpload() {
					const storedImage = storageRef.child(name)
					let response = await storedImage.put(uploadedFile)
					let imageUrl = await storedImage.getDownloadURL()
					console.log('Imageurl: ', imageUrl)
					return imageUrl
				}
				let self = this;
				fireBaseUpload().then(function (imageUrl) {
					var formData = new FormData();
					// attach inputs to formData
					formData.append('file', uploadedFile);
					formData.append('title', self.form.title);
					formData.append('description', self.form.description);
					formData.append('username', self.form.username);
					formData.append('imageUrl', imageUrl)

					axios
						.post('/upload', formData)
						.then(function (respond) {
							console.log('Axios Respond Upload: ', respond)
							self.images.unshift(respond.data);
						})
						.catch((err) => {
							console.log('Error in uploadFile: ', err);
						});

					//lines below clear the input-fields after upload
					self.form.title = '';
					self.form.username = '';
					self.form.description = '';
					file.value = '';
				})
			}
		}, //closes uploadFile;
	}, //closes methods
}); // closes Vue instance
//  ##################################################################################
// MODAL COMPONENT

Vue.component('image-modal', {
	template: '#image-modal',
	data: function () {
		return {
			image: {
				title: '',
				description: '',
				username: '',
				url: '',
				id: '',
			},
			comments: [],
			comment: {
				username: '',
				comment: '',
			},
		};
	},
	props: ['id'],
	mounted: function () {
		var self = this;
		axios
			.get('/image/' + self.id)

			.then(function (respond) {
				console.log('Respond in /image script.js', respond);
				self.image.url = respond.data[0].url;
				self.image.id = respond.data[0].id;
				self.image.username = respond.data[0].username;
				self.image.title = respond.data[0].title;
				self.image.description = respond.data[0].description;
			})
			.catch(function (err) {
				console.log(err);
			});

		axios.get('/comments/' + self.id).then(function (respond) {
			if (respond.data.length > 0) {
				for (let i = 0; i < respond.data.length; i++) {
					self.comments.unshift(respond.data[i]);
				}
			}
		});
	},

	methods: {
		postComment: function (e) {
			e.preventDefault();
			let self = this;

			axios
				.post('/comments/:id', {
					comment: self.comment.comment,
					username: self.comment.username,
					id: self.id,
				})
				.then(function (respond) {
					self.comments.unshift(respond.data[0]);
					self.comment.comment = '';
					self.comment.username = '';
				}); // results are from res.json(results) from db.postComment and go into then
		},

		sendCloseToParent: function () {
			//events from $emit always in lowercase (in kebap-case),no CamelCase!
			this.$emit('close-from-modal');
		},

		deleteImageConfirm: function () {
			document.getElementById('trash').style.display = 'none';
			document.getElementById('confirm').style.display = 'block';
		},

		goBack: function () {
			document.getElementById('trash').style.display = 'block';
			document.getElementById('confirm').style.display = 'none';
		},

		deleteImage: function () {
			let self = this;
			axios.post('/delete', {
				id: self.id,
			});
			this.$emit('deletedimage', {
				id: self.id,
			});
			this.$emit('close-from-modal');
			if (err) {
				console.log('Axios Delete: ', err)
			}
		},
	},
}); //closing component