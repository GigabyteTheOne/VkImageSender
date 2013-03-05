var imageUrl = null;
var _fileName;
var _photoData;
var _accToken;
var _photoObject;
var _userId;
var _uids = [];

function getObjectDescription(object)
{
	var res = "";
	for (var prop in object)
	{
		res += prop + "(" + (typeof prop) + "): " + object[prop] + "\n";
	}
	return res;
}

function hasClass(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
 
function addClass(ele,cls) {
	if (!this.hasClass(ele,cls)) ele.className += " "+cls;
}
 
function removeClass(ele,cls) {
	if (hasClass(ele,cls)) {
    	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}

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

function onGetPhoto(event)
{
	_photoData = event.srcElement.response;
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

function sendMessage()
{
	if (_uids && _photoObject)
	{
		var messageText = document.getElementById("message_text").value;
		for (var index = 0; index < _uids.length; index++)
		{
			var uid = _uids[index];
			var sendMessageRequest = new XMLHttpRequest();
			sendMessageRequest.open("GET", "https://api.vk.com/method/messages.send?" + 
				"uid=" + uid + 
				"&message=" + messageText +
				"&attachment=" + _photoObject.id +
				"&access_token=" + _accToken);
			sendMessageRequest.onload = onSendMessage;
			sendMessageRequest.send();
// 			onSendMessage();
		}
	}
}


function onSendMessage(event)
{
	//todo: write message in window, set timer with 5 seconds to close and button (like shutdown in ubuntu)
// 	alert("Sended");
// 	window.close();
}

function beginLoadFriendList()
{
	var getFriendsRequest = new XMLHttpRequest();
	getFriendsRequest.onload = onGetFriends;
	getFriendsRequest.open("GET", "https://api.vk.com/method/friends.get?"+
		"access_token=" + _accToken +
		"&fields=uid,first_name,last_name,photo,online,last_seen" +
		"&order=hints"
		);
	getFriendsRequest.send();
}

function onGetFriends(event)
{
	var answer = JSON.parse(event.target.response);
	if (answer.response)
	{
		var friendDiv = document.getElementById("friends_list");
		for (var friendNum = 0; friendNum < answer.response.length; friendNum++)
		{
			var friend = answer.response[friendNum];
			
			var div = document.createElement("div");
			div.className = "friend_row";
			div.setAttribute("uid", friend.uid);
			div.onclick = selectFriend;
			
			var flag = document.createElement("div");
			flag.className = "flag";
			div.appendChild(flag);
			
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			var td = document.createElement("td");
			td.className = "photo";
			
			var img = document.createElement("img");
			
			img.src = friend.photo;
			
			td.appendChild(img);
			tr.appendChild(td);
			
			td = document.createElement("td");
			td.className = "info";
			
			var name = document.createElement("a");
			name.innerHTML = friend.first_name + " " + friend.last_name;
			name.setAttribute("uid", friend.uid);
			
			var onlineDiv = document.createElement("div");
			onlineDiv.className = "online";
			if (friend.online == 1)
			{
				onlineDiv.innerHTML = "online";
			}
			
			td.appendChild(name);
			td.appendChild(onlineDiv);
			tr.appendChild(td);
			
			table.appendChild(tr);
			div.appendChild(table);
			
			
			
			friendDiv.appendChild(div);
		}
	}
}

function selectFriend(event)
{
	var row = event.currentTarget;
	var uid = row.getAttribute("uid");
	if (uid)
	{
		var index = _uids.indexOf(uid);
		if (index === -1)
		{
			if (!hasClass(row, "selected"))
			{
				addClass(row, "selected");
			}
			_uids.push(uid);
		}
		else
		{
			if (hasClass(row, "selected"))
			{
				removeClass(row, "selected");
			}
			_uids.splice(index, 1);
		}
		
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
	document.getElementById("send_button").onclick = sendMessage;
});



function thereIsAnError(textToShow, errorToShow)
{
	document.getElementById('error_message').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
}