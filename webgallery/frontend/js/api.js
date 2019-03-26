/* jshint esversion: 6 */

let api = (function(){
    let module = {};

    // this is used for storing the currentImageId
    let currentImageId = -1;

    /*  ******* Data types *******
        image objects must have at least the following attributes:
            - (String) _id
            - (String) title
            - (String) author
            - (Date) date

        comment objects must have the following attributes
            - (String) _id
            - (String) imageId
            - (String) author
            - (String) content
            - (Date) date

    ****************************** */

    // copy this chunk of code from the lecture 04's code
    function sendFiles(method, url, data, callback){
        let formdata = new FormData();
        Object.keys(data).forEach(function(key){
            let value = data[key];
            formdata.append(key, value);
        });
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        xhr.send(formdata);
    }

    // copy this chunk of code from the lecture 04's code
    function send(method, url, data, callback){
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
            else callback(null, JSON.parse(xhr.responseText));
        };
        xhr.open(method, url, true);
        if (!data) xhr.send();
        else{
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
        }
    }

    // add an image to the gallery
    module.addImage = function(title, file){
        sendFiles("POST", "/api/images/", {title: title, picture: file}, function(err, image){
            if (err) return notifyErrorUpdate(err.message);
            if (image !== null) {
                currentImageId = image._id;
            }
            notifyImagesUpdate(image);
            notifyCommentUpdate(currentImageId);
        });
    };

    // delete an image from the gallery given its imageId
    module.deleteImage = function(imageId){
        send("DELETE", "/api/images/" + imageId + "/", {}, function(err, image){
            if (err) return notifyErrorUpdate(err.message);
            // modify the currentImageId
            if (image === null) {
                currentImageId = -1;
            } else {
                currentImageId = image._id;
            }
            notifyImagesUpdate(image);
            notifyCommentUpdate(currentImageId);

        });
    };

    // change to the previous image
    module.changeToPrevious = function(imageId, author) {
        send("GET", "/api/images/prev/" + imageId + "/" + author + "/", {}, function(err, image) {
            if (err) return notifyErrorUpdate(err.message);
            if (image !== null) {
                currentImageId = image._id;
                notifyImagesUpdate(image);
                notifyCommentUpdate(image._id);
            }
        });
    };

    // change to the next image
    module.changeToNext = function(imageId, author) {
        send("GET", "/api/images/next/" + imageId + "/" + author + "/", {}, function(err, image){
            if (err) return notifyErrorUpdate(err.message);
            if (image !== null) {
                currentImageId = image._id;
                notifyImagesUpdate(image);
                notifyCommentUpdate(image._id);
            }
        });
    };


    // add a comment to an image
    module.addComment = function(imageId, content){
        send("POST", "/api/comments/", {imageId: imageId, content: content}, function(err, comment) {
            if (err) return notifyErrorUpdate(err.message);
            notifyCommentUpdate(imageId);
        });
    };

    // delete a comment to an image
    module.deleteComment = function(commentId){
        send("DELETE", "/api/comments/" + commentId + "/", {}, function(err, comment) {
            if (err) return notifyErrorUpdate(err.message);
            notifyCommentUpdate(currentImageId);
        });
    };

    // change to the previous comment page of current Image
    module.changeToPreviousCommentPage = function(imageId) {
        send("GET", "/api/images/" + currentImageId + "/", {}, function(err, image) {
            if (err) return notifyErrorUpdate(err.message);
            let previousPageIndex = parseInt(image.currentCommentPage)-1;
            if (previousPageIndex >= 0) {
                send("GET", "/api/comments/" + currentImageId + "/" + previousPageIndex + "/", {}, function(err, comment) {
                    notifyCommentUpdate(currentImageId);
                });
            }
        });
    };

    // change to the next comment page of the current page
    module.changeToNextCommentPage = function(imageId) {
        send("GET", "/api/images/" + currentImageId + "/", {}, function(err, image) {
            if (err) return notifyErrorUpdate(err.message);
            let nextPageIndex = parseInt(image.currentCommentPage)+1;
            send("GET", "/api/comments/" + currentImageId + "/" + nextPageIndex + "/", {}, function(err, comment) {
                notifyCommentUpdate(currentImageId);
            });
        });
    };

    // get the current Image id
    module.getCurrentImage = function() {
        return currentImageId;
    };


    let imageListener = [];
    let commentListener = [];
    let errorListener = [];
    let userListeners = [];

    // register an image listener
    // to be notified when an image is added or deleted from the gallery
    module.onImageUpdate = function(listener){
        imageListener.push(listener);
    };

    // notify the frontend controller to update the image gallery
    notifyImagesUpdate = function(image) {
        imageListener.forEach(function(listener) {
            if (image !== null) {
                currentImageId = image._id;
            }
            listener(image);
        });
    };

    // register an comment listener
    // to be notified when a comment is added or deleted to an image
    module.onCommentUpdate = function(listener){
        commentListener.push(listener);
    };

    // notify the frontend controller to update the comment box
    notifyCommentUpdate = function(imageId) {
        send("GET", "/api/images/" + imageId + "/", {}, function(err, image) {
            if (image != null) {
                let currentCommentPage = image.currentCommentPage;
                let prevCommentPage = image.currentCommentPage-1;
                send("GET", "/api/comments/" + imageId + "/" + currentCommentPage + "/", {}, function(err, comments){
                    if (err) return notifyErrorUpdate(err.message);

                    if (comments === null && prevCommentPage >= 0) {
                        send("GET", "/api/comments/" + imageId + "/" + prevCommentPage + "/", {}, function(err, comments){
                            if (err) return notifyErrorUpdate(err.message);
                            commentListener.forEach(function(listener) {
                                listener(comments);
                            });
                        });
                    } else {
                        commentListener.forEach(function(listener) {
                            listener(comments);
                        });
                    }

                });
            }
        });
    };

    // register a error listener to deal with errors
    module.onErrorUpdate = function(listener) {
        errorListener.push(listener);
    };

    // call the listener functions to deal with errors
    notifyErrorUpdate = function(err) {
        errorListener.forEach(function(listener) {
            listener(err);
        });
    };



    function getUsername(){
        return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    }

    function notifyUserListeners(username){
        userListeners.forEach(function(listener){
            listener(username);
            if (username !== '') {
                send("GET", '/api/users/image/' + username + "/", {}, function(err, image){
                    notifyImagesUpdate(image);
                    if (image !== null) {
                        notifyCommentUpdate(image._id);
                    }
                });
            }
        });
    }

    module.onUserUpdate = function(listener){
        userListeners.push(listener);
        listener(getUsername());

        if (getUsername() !== '') {
            send("GET", '/api/users/image/' + getUsername() + "/", {}, function(err, image){
                notifyImagesUpdate(image);
                if (image !== null) {
                    notifyCommentUpdate(image._id);
                }
            });
        }
    };

    // get username function
    module.getUsernames = function(callback) {
        let pageIndex = 0;
        send("GET", "/api/users/list/" + pageIndex + "/" , {}, callback);
    };

    // this is the signin function
    module.signin = function(username, password){
        send("POST", "/signin/", {username, password}, function(err, res){
            if (err) return notifyErrorUpdate(err);
            notifyUserListeners(getUsername());
            // notifyUsersListeners();
        });
    };

    // this is the sign up function
    module.signup = function(username, password){
        send("POST", "/signup/", {username, password}, function(err, res){
            if (err) return notifyErrorUpdate(err);
            notifyUserListeners(getUsername());
            // notifyUsersListeners();
        });
    };

    module.signout = function(){
        send("GET", "/signout/", {}, function(err, res){
            if (err) return notifyErrorUpdate(err);
            notifyUserListeners('');
        });
    };


    return module;
})();