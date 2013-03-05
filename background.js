var authTabId;
var vkToken;
var imageURL;
var getNewToken = false;

function onContextMenuItemClick(info, tab)
{
	imageURL = info.srcUrl;
	if (!vkToken)
	{
		chrome.storage.local.get({'vkaccess_token': {}}, onGetAccessToken);
	}
	else
	{
		uploadImage();
	}
}

function onGetAccessToken(items)
{
	if ((items['vkaccess_token'].length > 0) && (!getNewToken))
	{
		vkToken = items['vkaccess_token'];
		uploadImage();
	}
	else
	{
		getVkAccesToken();
	}
}

function uploadImage()
{
	var loadUrl = 'upload.html#' + imageURL + '&' + vkToken;

	if (authTabId)
	{
		chrome.tabs.update(authTabId, {'url': loadUrl, 'active': true}, function(tab){});
		delete authTabId;
	}
	else 
	{
// 		chrome.tabs.create({"url": loadUrl, "selected": true});
		chrome.windows.create({
			"url": loadUrl, 
			"type": "panel",
			"width": 600,
			"height": 600
			
		}, function(window) {});
	}
}

function getVkAccesToken()
{
	var appId = "3467502";
	var scope = "docs,offline,messages,photos";
	var redirectUri = encodeURIComponent("http://oauth.vk.com/blank.html");
	
	var authUrl = "https://oauth.vk.com/authorize?client_id=" + appId + 
		"&scope=" + scope + 
		"&redirect_uri=" + redirectUri + 
		"&display=page&response_type=token";
	
	chrome.tabs.create({"url": authUrl, "selected": true}, function(tab)
	{
		authTabId = tab.id;
		chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo)
		{
			if (tabId == authTabId && changeInfo.url != undefined && changeInfo.status == "loading")
			{
				if (changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1 )
				{
					chrome.tabs.onUpdated.removeListener(tabUpdateListener);
					var accToken = getUrlParam(changeInfo.url, 'access_token');
					
					if(accToken != undefined && accToken.length > 0)
					{
						if(Number(getUrlParam(changeInfo.url, 'expires_in') == 0))
						{
							vkToken = accToken;
							chrome.storage.local.set({'vkaccess_token': accToken}, function()
							{
								uploadImage();
							});
						}
						else
						{
							thereIsAnError('vk auth response problem', 'expiresIn != 0');
						}
					}
					else
					{
						thereIsAnError('vk auth response problem', 'access_token length = 0 or accToken == undefined');
					}
				}
			}
		});
	});
	
// 	if (callback)
// 		callback();
}

function getUrlParam(url, sname)
{
	var params = url.substr(url.indexOf("#") + 1);
	var sval = "";
	params = params.split("&");
	for(var i = 0; i < params.length; i++)
	{
		temp = params[i].split("=");
		if([temp[0]] == sname)
		{
			sval = temp[1];
		}
	}
	return sval;
}


chrome.contextMenus.create(
{
	"title": "Send image in VK",
	"type": "normal",
	"contexts": ["image"],
	"onclick": onContextMenuItemClick
});


function thereIsAnError(textToShow, errorToShow)
{
	alert(textToShow + '\n' + errorToShow);
}