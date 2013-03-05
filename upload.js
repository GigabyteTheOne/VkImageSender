var imageUrl = null;
var _fileName;
var _photoData;
var _accToken;
var _photoObject;
var _userId;

function upload(imageUrl, fileName, accToken)
{
	_fileName = fileName
	_accToken = accToken;
	var getPhotoHttpRequest = new XMLHttpRequest();
	getPhotoHttpRequest.onload = onGetPhoto;
	getPhotoHttpRequest.responseType = 'blob';
	getPhotoHttpRequest.open('GET', imageUrl);
	getPhotoHttpRequest.send();
}

fucntion onGetPhoto(event)
{
	var answer = JSON.parse(event.target.response);
	_photoData = event.response;
	var getPhotoUploadServer = new XMLHttpRequest();
	getPhotoUploadServer.open('GET', 'https://api.vk.com/method/photos.getMessagesUploadServer?access_token=' + _accToken);
	getPhotoUploadServer.onload = onGetPhotoUploadServer;
	getPhotoUploadServer.send();
}

function onGetPhotoUploadServer(event)
{
	var answer = JSON.parse(event.target.response);
// 	alert(event.target.response);
	if (answer.response.upload_url)
	{
		var formData = new FormData();
		formData.append("photo", _photoData, _fileName + ".jpg");
		var postPhotoRequest = new XMLHttpRequest();
		postPhotoRequest.open("POST", answer.response.upload_url, true);
		postPhotoRequest.onload = onPostPhoto;
		postPhotoRequest.send(formData);
	}
}

function onPostPhoto(event)
{
	var answer = JSON.parse(event.target.response);
// 	alert(event.target.response);
 	if (answer.photo)
 	{
 		var savePhotoRequest = new XMLHttpRequest();
 		savePhotoRequest.open("GET", "https://api.vk.com/method/photos.saveMessagesPhoto?server=" + answer.server +
 			"&photo=" + answer.photo + 
 			"&hash=" + answer.hash + 
 			"&access_token=" + _accToken);
 		savePhotoRequest.onload = onSavePhoto;
 		savePhotoRequest.send();
 	}
 	else
 	{
 		alert("Photo not uploaded");
 	}
}

function onSavePhoto(event)
{
	var answer = JSON.parse(event.target.response);
// 	alert(event.target.response);
	if (answer.response)
	{
		_photoObject = answer.response[0];
		document.getElementById("loader_image_wrapper").style.display = "none";
		document.getElementById("photo_image_wrapper").style.display = "block";
		document.getElementById("photo_image").src = _photoObject.src;
	}
	else
	{
		alert("Error");
	}
}

function sendMessage(uid)
{
	if (uid && _photoObject)
	{
		var messageText = document.getElementById("message_text").value;
		var sendMessageRequest = new XMLHttpRequest();
		sendMessageRequest.open("GET", "https://api.vk.com/method/messages.send?" + 
			"uid=" + uid + 
			"&message=" + messageText +
			"&attachment=" + _photoObject.id +
			"&access_token=" + _accToken);
		sendMessageRequest.onload = onSendMessage;
		sendMessageRequest.send();
	}
}


function onSendMessage(event)
{
	window.close();
}

function beginLoadFriendList()
{
	var getFriendsRequest = new XMLHttpRequest();
	getFriendsRequest.onload = onGetFriends;
	getFriendsRequest.open("GET", "https://api.vk.com/method/friends.get?"+
		"access_token=" + _accToken +
		"&fields=uid,first_name,last_name,photo" +
		"&order=hints"
		);
	getFriendsRequest.send();
}

function onGetFriends(event)
{
	var answer = JSON.parse(event.target.response);
	if (answer.response)
	{
		var table = document.createElement("table");
		for (var friendNum = 0; friendNum < answer.response.length; friendNum++)
		{
			var friendObject = answer.response[friendNum];
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			var img = document.createElement("img");
			img.src = friendObject.photo;
			td.appendChild(img);
			tr.appendChild(td);
			
			td = document.createElement("td");
			var name = document.createElement("a");
			name.innerHTML = friendObject.first_name + " " + friendObject.last_name;
			name.href = "#";
			name.onclick = selectFriend;
			name.setAttribute("uid", friendObject.uid);
			
			td.appendChild(name);
			tr.appendChild(td);
			
			table.appendChild(tr);
		}
		var friendDiv = document.getElementById("friends_list");
		friendDiv.appendChild(table);
	}
}

function selectFriend(sender, event)
{
	var uid = sender.target.getAttribute("uid");
	if (uid)
	{
		sendMessage(uid);
	}
}

document.addEventListener("DOMContentLoaded", function()
{
	var params = window.location.hash.substring(1).split('&');
	if(params && params.length == 2)
	{
		var filename = params[0].split('/');
		if(filename.length > 0)
		{
			imageUrl = params[0];
			var imageName = filename[filename.length - 1];
			if (imageName.indexOf('?') > -1 )
			{
				imageName = imageName.slice( 0, imageName.indexOf('?'));
			}
			if (imageName.indexOf('#') > -1 )
			{
				imageName = imageName.slice( 0, imageName.indexOf('#'));
			}    
			if (imageName.indexOf('&') > -1 )
			{
				imageName = imageName.slice( 0, imageName.indexOf('&'));
			}
			upload(imageUrl, imageName, params[1]);
			beginLoadFriendList();
		}
		else
		{
		  thereIsAnError('Getting image filename', 'filename.length <= 0');
		}
	}
	else
	{
		thereIsAnError('Parsing image url', 'params || params.length != 2');
	}
});

function thereIsAnError(textToShow, errorToShow)
{
	document.getElementById('error_message').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
}