/* jshint esversion: 6 */

window.onload = function() {

	"use strict";

	// this function is used to open the imageForm
    function loadImageForm() {
        let elem = document.getElementById('image_info_form');
        elem.innerHTML= '';

        // create the imageForm element
        let newElem = document.createElement('form');
        newElem.className = "add_image_form";
        newElem.innerHTML=`
			<div class="form_title">Enter your Image Information</div>
			<input id="image_title" class="form_item" type="text" name="title" placeholder="Enter your image title" required/>
			<input id="image_picture" type="file" name="image_picture" class="form_item" required/>
			<button id="image_button" type="submit" class="btn">Add an image</button>
		`;
        elem.prepend(newElem);

        // add the eventListener for the submit button and call api.addimage to deal with it
        document.querySelector(".add_image_form").addEventListener('submit', function(e) {
            // prevent the default refresh event
            e.preventDefault();

            // get the title, author, and url from the form
            let title = document.getElementById("image_title").value;
            let author = document.getElementById("image_author").value;
            let image = document.getElementById("image_picture").files[0];


            // clean form
            newElem.reset();

            api.addImage(title, image);
        });
    }

    /*
    This event listener is used to toggle the image form
    */
    document.getElementById("toggle_button").addEventListener('click', function(e){
        // prevent the default refresh behaviour
        e.preventDefault();

        //get the form handler
        let elem = document.getElementById('image_info_form');

        // if the form is not show now, then show it
        if (elem.innerText === '') {
            loadImageForm();
        // if the form is already shown, then close it
        } else {
            elem.innerHTML= '';
		}
    });


	/*
	register two update function listner functions
	*/
    api.onErrorUpdate(function(err) {
        console.log(err);
    });

    api.onErrorUpdate(function(err){
        var error_box = document.querySelector('#error_box');
        error_box.innerHTML = err;
        error_box.style.visibility = "visible";
    });


	// register the listener function for imageUpdate
	api.onImageUpdate(function(image) {
		// clean the gallery
		let elet = document.getElementById("gallery");
		elet.innerHTML = '';

		// if there're some saved images
		if (image != null) {

		    document.getElementById('add_comment_form').style.visibility = "visible";
		    document.getElementById('comment_box').style.visibility = "visible";

			// get the image information
			let newAuthor = image.author;
			let newTitle = image.title;
			let imageId = image._id;

			// change the image gallery information
			let newElem = document.createElement('div');
			newElem.setAttribute('id', "image_gallery");
			newElem.innerHTML=`
				<button id='previous_image'><<</button>
				<div class="main_container">
					<img id='img_url' src="/api/images/${imageId}/picture/">
					<div class="extra_info">
						<div id="gallery_title">title: ${newTitle}</div>
						<div id="gallery_author">Author: ${newAuthor}</div>
						<button id='delete_image'>delete</button>
					</div>
				</div>
				<button id='next_image'>>></button>
			`;
			document.getElementById("gallery").prepend(newElem);

			// add event listener for the delete image button
			document.getElementById('delete_image').addEventListener('click', function(){
				api.deleteImage(imageId);
			});

			// add event listener for the go previous button
			document.getElementById('previous_image').addEventListener('click', function(){
				api.changeToPrevious(imageId, newAuthor);
			});

			// add event listener for the go next button
			document.getElementById('next_image').addEventListener('click', function(){
				api.changeToNext(imageId, newAuthor);
			});

		} else {
            document.getElementById('add_comment_form').style.visibility = "hidden";
            document.getElementById('comment_box').style.visibility = "hidden";
		}
	});



	// register the listener function for the commentUpdate
	api.onCommentUpdate(function(comments) {
		// clean the comment Box
		let elet = document.getElementById("comment_content");
		elet.innerHTML = '';

		if (comments != null) {
			comments.forEach(function(comment) {
				let container = document.getElementById('comment_content');

		    	let newElem = document.createElement('div');
				newElem.className = "comment";
				newElem.setAttribute('id', comment._id);
				newElem.innerHTML = `
					<div class="comment_author">${comment.author}</div>
					<div class="comment_text">${comment.content}</div>
					<div class="comment_date">${comment.date}</div>
					<button class="iconButton" id="message-delete">
						<div class="garbageIcon"></div>
					</button>
				`;
				container.prepend(newElem);

				document.getElementById("message-delete").addEventListener('click', function(){
					api.deleteComment(comment._id);
				});
			});
		}
	});

	api.onUserUpdate(function(user) {

	    if (user !== '') {
            document.getElementById("all_items").style.visibility = 'visible';
            document.getElementById("log_in_form").style.display = 'none';
            document.getElementById('selector').style.visibility = 'visible';

            api.getUsernames(function(err, users) {
                document.querySelector("#image_author").innerHTML = "";
                if (users.length === 0) document.querySelector("#selector").style.visibility = 'hidden';
                else {
                    document.querySelector("#selector").style.visibility = 'visible';
                    users.forEach(function(user){
                        let elmt = document.createElement('option');
                        elmt.value = user._id;
                        elmt.innerHTML= user._id;
                        document.querySelector("#image_author").prepend(elmt);
                    });
                }
            });
        } else {
            document.getElementById("all_items").style.visibility = 'hidden';
            document.getElementById("log_in_form").style.display = 'flex';
        }
    });

	/*
	This event listener is used to add a new comment
	*/
	document.getElementById('add_comment_form').addEventListener('submit', function(e){
		// prevent the default refresh behaviour
		e.preventDefault();

		// read form elements
        let content = document.getElementById("comment_comment").value;

        // clean form
        document.getElementById("add_comment_form").reset();

        // get currentImageId
        let currentImageid = api.getCurrentImage();

        // add the new Message
        api.addComment(currentImageid, content);
	});

	/*
	The next two eventListner function is used to control changing the page of comment box
	*/
	// add event listner for the commentbox previous-page button
	document.getElementById("previous_comment_page").addEventListener('click', function(){
		api.changeToPreviousCommentPage(api.getCurrentImage());
	});

	// add event listner for the commentbox next-page button
	document.getElementById("next_comment_page").addEventListener('click', function(){
		api.changeToNextCommentPage(api.getCurrentImage());
	});

	// this is the submit function for signup and signin function
	function submit() {
        if (document.querySelector("form").checkValidity()){
            let username = document.querySelector("form [name=username]").value;
            let password = document.querySelector("form [name=password]").value;
            let action = document.querySelector("form [name=action]").value;
            api[action](username, password, function(err){
                if (err) document.querySelector('.error_box').innerHTML = err;
            });
        }
    }

    // this is the signup event listener
    document.getElementById('signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector("form [name=action]").value = 'signup';
        submit();
    });

	// this is the signin event listener
    document.getElementById('signin').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector("form [name=action]").value = 'signin';
        submit();
    });

    // this is the signout event listener
    document.getElementById('signout').addEventListener('click', function(e){
        e.preventDefault();
        document.getElementById('selector').style.visibility = 'hidden';
        api.signout();
    });

};
