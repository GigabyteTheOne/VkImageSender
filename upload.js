var imageUrl = null;
var _fileName;
var _photoData;
var _accToken;
var _photoObject;
var _userId;
var _uids = [];
var _allFriendsArr = [];

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
	_fileName = fileName;
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
	// alert(getObjectDescription(event.srcElement.response));


	var ext = _fileName.split('.').pop();
	if (!(ext && ext.length < 5))
	{
		var fileType = event.srcElement.response.type;
		var fileTypeArr = fileType.split('/');
		ext = "jpg";
		if (fileTypeArr.length > 1) 
		{
			ext = fileTypeArr.pop();
		}
		_fileName += "." + ext;
	}
	ext = ext.toLowerCase();

	if (ext !== "gif")
	{
		var getPhotoUploadServer = new XMLHttpRequest();
		getPhotoUploadServer.open('GET', 'https://api.vk.com/method/photos.getMessagesUploadServer?access_token=' + _accToken);
		getPhotoUploadServer.onload = onGetPhotoUploadServer;
		getPhotoUploadServer.send();
	}
	else
	{
		var getDocUploadServer = new XMLHttpRequest();
		getDocUploadServer.open('GET', 'https://api.vk.com/method/docs.getUploadServer?access_token=' + _accToken);
		getDocUploadServer.onload = onGetDocUploadServer;
		getDocUploadServer.send();
	}
}

function onGetDocUploadServer(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response.upload_url)
	{
		var formData = new FormData();
		formData.append("file", _photoData, _fileName);
		var postPhotoRequest = new XMLHttpRequest();
		postPhotoRequest.open("POST", answer.response.upload_url, true);
		postPhotoRequest.onload = onPostDoc;
		postPhotoRequest.send(formData);
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onGetPhotoUploadServer(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response.upload_url)
	{
		var formData = new FormData();
		formData.append("photo", _photoData, _fileName);
		var postPhotoRequest = new XMLHttpRequest();
		postPhotoRequest.open("POST", answer.response.upload_url, true);
		postPhotoRequest.onload = onPostPhoto;
		postPhotoRequest.send(formData);
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onPostDoc(event)
{
	// alert(event.target.response);
	if (event.target.response.indexOf("Security Breach2") !== -1)
	{
		alert(event.target.response);
		return;
	}

	var answer = JSON.parse(event.target.response);
	
 	if (answer.file)
 	{
 		var saveDocRequest = new XMLHttpRequest();
 		saveDocRequest.open("GET", "https://api.vk.com/method/docs.save?file=" + answer.file + "&access_token=" + _accToken);
 		saveDocRequest.onload = onSaveDoc;
 		saveDocRequest.send();
 	}
 	else
 	{
 		alert("Doc not uploaded");
 	}
}

function onPostPhoto(event)
{
	// alert(event.target.response);
	if (event.target.response.indexOf("Security Breach2") !== -1)
	{
		alert(event.target.response);
		return;
	}

	var answer = JSON.parse(event.target.response);
	
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

function onSaveDoc(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response)
	{
		_docObject = answer.response[0];
		document.getElementById("loader_image_wrapper").style.display = "none";
		document.getElementById("photo_image").style.display = "block";
		document.getElementById("photo_image").src = _docObject.url;
		refreshButtonState();
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onSavePhoto(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response)
	{
		_photoObject = answer.response[0];
		document.getElementById("loader_image_wrapper").style.display = "none";
		document.getElementById("photo_image").style.display = "block";
		document.getElementById("photo_image").src = _photoObject.src;
		refreshButtonState();
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function sendMessage()
{
	chrome.storage.local.set({'windowCoord': {
		x: window.screenX,
		y: window.screenY,
		w: window.innerWidth,
		h: window.innerHeight,
	}});

	if ((_uids.length > 0) && (_photoObject || _docObject))
	{
		var messageContainer = document.getElementById("message_text");
		var messageText = messageContainer.value || "";
		for (var index = 0; index < _uids.length; index++)
		{
			var uid = _uids[index];

			var attachmentStr = "";
			if (_photoObject) 
			{
				attachmentStr = _photoObject.id;
			}
			else
			{
				attachmentStr = "doc" + _docObject.owner_id + "_" + _docObject.did;
			}

			var sendMessageRequest = new XMLHttpRequest();
			sendMessageRequest.open("GET", "https://api.vk.com/method/messages.send?" + 
				"uid=" + uid + 
				"&message=" + messageText +
				"&attachment=" + attachmentStr +
				"&access_token=" + _accToken);
			sendMessageRequest.onload = onSendMessage;
			sendMessageRequest.uid = uid;
			sendMessageRequest.send();
		}
	}
}


function onSendMessage(event)
{
	//todo: write message in window, set timer with 5 seconds to close and button (like shutdown in ubuntu)
	var answer = JSON.parse(event.target.response);
	if (answer.response && event.target.uid)
	{
		var index = _uids.indexOf(event.target.uid);
		if (index !== -1)
		{
			_uids.splice(index, 1);
		}
		if (_uids.length === 0) 
		{
			window.close();
		}
	}
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
		_allFriendsArr = answer.response;
		refreshFriendsList(_allFriendsArr);

		document.getElementById("loader_friends_wrapper").style.display = "none";
	}
}

function refreshFriendsList (friendsArr) {
	var friendsTable = document.getElementById("friends_list").tBodies[0];
	friendsTable.innerHTML = "";

	if (friendsArr.length === 0) {
		var tr = document.createElement("tr");
		var p = document.createElement("p");
		p.className = "text-center";
		p.innerText = chrome.i18n.getMessage("not_found");
		tr.appendChild(p);
		friendsTable.appendChild(tr);
	}

	for (var friendNum = 0; friendNum < friendsArr.length; friendNum++)
	{
		var friend = friendsArr[friendNum];
		
		var tr = document.createElement("tr");
		tr.setAttribute("uid", friend.uid);
		tr.onclick = selectFriend;
		
		var td = document.createElement("td");
		td.className = "col_photo";
		
		var img = document.createElement("img");
		img.className = "img-thumbnail";
		img.src = friend.photo;
		
		td.appendChild(img);
		tr.appendChild(td);
		
		td = document.createElement("td");
		// td.className = "info";
		
		var name = document.createElement("a");
		name.innerHTML = friend.first_name + " " + friend.last_name;
		name.setAttribute("uid", friend.uid);
		
		var onlineDiv = document.createElement("div");
		var onlineSpan = document.createElement("span");
		onlineSpan.className = "label label-info my_label";
		if (friend.online == 1)
			onlineSpan.innerHTML = "online";
		onlineDiv.appendChild(onlineSpan);
		
		td.appendChild(name);
		td.appendChild(onlineDiv);
		tr.appendChild(td);

		td = document.createElement("td");
		img = document.createElement("img");
		img.className = "flag";
		td.appendChild(img);
		tr.appendChild(td);
		
		friendsTable.appendChild(tr);
	}
}

function selectFriend(event)
{
	chrome.storage.local.set({'windowCoord': {
		x: window.screenX,
		y: window.screenY,
		w: window.innerWidth,
		h: window.innerHeight,
	}});

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
	refreshButtonState();
}

function refreshButtonState()
{
	var sendButton = document.getElementById("send_button");
	if ((_uids.length > 0) && (_photoObject || _docObject))
	{
		removeClass(sendButton, "disabled");
	}
	else
	{
		addClass(sendButton, "disabled");
	}
	
}

document.addEventListener("DOMContentLoaded", function()
{
	var sendButton = document.getElementById("send_button");
	sendButton.onclick = sendMessage;
	refreshButtonState();

	document.getElementById("s_search").onkeyup = onFriendFilterChange;
	document.getElementById("friends_list").onclick = onFriendFilterClick;

	var sendButtonTitle = 
		friendsLoaderText = 
		imageLoaderText = 
		documentTitle = "";

	if (chrome.i18n) {
		sendButtonTitle = chrome.i18n.getMessage("upload_send_button_title");
		friendsLoaderText = chrome.i18n.getMessage("upload_friends_loader_text");
		imageLoaderText = chrome.i18n.getMessage("upload_image_loader_text");
		documentTitle = chrome.i18n.getMessage("upload_page_title");
	}
	else {
		sendButtonTitle = "Отправить";
		friendsLoaderText = "Загрузка списка друзей...";
		imageLoaderText = "Загрузка изображения...";
		documentTitle = "Отправка изображения с помощью сообщения ВКонтакте";
	}


	document.getElementById("send_button").innerText = sendButtonTitle;
	document.getElementById("friends_loader_text").innerHTML = friendsLoaderText;
	document.getElementById("image_loader_text").innerHTML = imageLoaderText;
	document.title = documentTitle;

	document.getElementById("message_text").onkeypress = onMessageTextKeyPress;

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
	
	document.getElementById("message_text").placeholder = chrome.i18n.getMessage("upload_send_text_title");
	document.getElementById("s_search").placeholder = chrome.i18n.getMessage("search_input_placeholder");
	
	window.onresize = resizeElements;
	resizeElements();
});

function resizeElements() {
	var height = window.innerHeight;
	listHeight = height - 90;
	document.getElementById("friends_list_wrapper").style.height = listHeight + "px";
}

function onMessageTextKeyPress(e) 
{ 
	if (e.which === 13)
	{
		if (e.ctrlKey)
			sendMessage();
		return false;
	}
	return true
}

function onFriendFilterChange (e) {
	if (e.target) 
	{
		var text = e.target.value;
		text = text.toLowerCase();
		var fountFriends = [];

		for (var i = 0; i < _allFriendsArr.length; i++) {
			var friend = _allFriendsArr[i];
			var string = friend.first_name + " " + friend.last_name;
			string = string.toLowerCase();
			if (string.indexOf(text) !== -1) {
				fountFriends.push(friend);
			}
		}

		refreshFriendsList(fountFriends);
	}
}

function onFriendFilterClick (e) {
	document.getElementById("s_search").focus();
}

function thereIsAnError(textToShow, errorToShow)
{
	// document.getElementById('error_message').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
	var errorDim = document.getElementById('error_message');
	var div = document.createElement("div");
	div.className = "alert alert-danger";

	var errorDescription = chrome.i18n.getMessage("error_message_title");

	div.innerHTML = "<b>" +errorDescription+ "</b><br />" + 
					textToShow + "<br />" +
					errorToShow;

	errorDim.appendChild(div);
	errorDim.style.display = "block";

	document.getElementById('main_content').style.display = "none";
}




