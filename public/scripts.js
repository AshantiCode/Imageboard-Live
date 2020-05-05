(function () {
	new Vue({
		el: '#main',
		data: {
			imageId: '',
			images: [],
			form: {
				title: '',
				username: '',
				description: '',
				file: null,
			},
		},
		mounted: function () {
			var self = this;

			axios.get('/images').then(function (res) {
				console.log('Res in /images', res);
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

				var index = self.images.findIndex(function (result) {
					return result.id === data.id;
				});
				this.images.splice(index, 1);
			},

			uploadFile: function (e) {
				var file = document.getElementById('file');
				var uploadedFile = file.files[0];

				//now we want to prepate the files by using API Form Data to then send them to the server with axious.
				var formData = new FormData();

				// attach inputs to formData
				formData.append('file', uploadedFile);
				formData.append('title', this.form.title);
				formData.append('description', this.form.description);
				formData.append('username', this.form.username);

				let self = this;

				axios
					.post('/upload', formData)
					.then(function (respond) {
						self.images.unshift(respond.data);
					})
					.catch((err) => {
						console.log('Error in uploadFile: ', err);
					});

				//lines below clear the input-fields after upload
				this.form.title = '';
				this.form.username = '';
				this.form.description = '';
				file.value = '';
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
			},
		},
	}); //closing component
})();
