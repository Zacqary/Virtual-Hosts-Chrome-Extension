var vhost = "";
var ip = "";
var enabled = false;
var requestsToRemap = {};

var requestRecord = {};

chrome.webRequest.onBeforeRequest.addListener(
	function(details){
		if (enabled) {
			// Get the request's domain and compare it to the vhost
			var domain = details.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
			if (domain === vhost){
				// Redirect this request to ip, and prepare to send it with a new Host header
				var redirectUrl = details.url.replace(vhost, ip);
				requestsToRemap[redirectUrl] = vhost;

				// Count the number of requests redirected on the current tab
				recordRequest(details);

				return {redirectUrl: redirectUrl};
			}	
		}
	},
	{urls: ["<all_urls>"]},
	["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		showHostOnPage(details.tabId, vhost);
		if (enabled && requestsToRemap[details.url])
		{
			var remap = requestsToRemap[details.url];
			details.requestHeaders.push({ name: "Host", value: remap });
			console.log(details.type);
			if (details.type === "main_frame"){
				
			}
			delete requestsToRemap[details.url];
			return {requestHeaders: details.requestHeaders};
		}
	},
	{urls: ["<all_urls>"]},
	["blocking", "requestHeaders"]
);

chrome.webNavigation.onBeforeNavigate.addListener(
	function(details){
		try {
				chrome.tabs.get(details.tabId, function(tab){
					if (tab){
						if (tab.url === details.url){
							requestRecord[details.tabId] = 0;
						}
					}
				});
				updateBadges();
		} catch (e){
			console.log("No tab with id " + details.tabId);
		}
	}
);

function updateBadges(){
	for (var i in requestRecord){
		var badgeText = '';
		if (requestRecord[i].length > 0){
			badgeText = requestRecord[i].length.toString();
		}
		chrome.browserAction.setBadgeText({text: badgeText, tabId: parseInt(i)});
	}
}

function recordRequest(details){
	if (!requestRecord[details.tabId]){
		requestRecord[details.tabId] = [];
	}
	requestRecord[details.tabId].push(details.url);
	updateBadges();
}

function showHostOnPage(tabId, vhost){
	if (tabId > -1){
		function hostIndicator(){
			(function(){
				if (!window.vHostIndicator && vhost !== ''){
					window.vHostIndicator = document.createElement('DIV');
					var indicator = window.vHostIndicator;
					indicator.innerHTML = vhost;
					indicator.style.display = "block";
					indicator.style.position = "fixed";
					indicator.style.top = "10px";
					indicator.style.right = "10px";
					indicator.style.zIndex = "99999999";
					indicator.style.background = "#555";
					indicator.style.color = "white";
					indicator.style.padding = "10px";
					indicator.style.borderRadius = "10px";
					indicator.style.opacity = "0.5";
					indicator.style.fontSize = "18px";
					indicator.style.cursor = "default";
					indicator.style['-webkit-user-select'] = 'none';
					indicator.addEventListener('mouseenter', function(){
						indicator.style.opacity = "1";
					});
					indicator.addEventListener('mouseleave', function(){
						indicator.style.opacity = "0.5";
					});
					document.body.appendChild(window.vHostIndicator);
				}
			})();
		}
		var code = hostIndicator.toString().replace('function hostIndicator(){','').slice(0, -1).replace(/vhost/g,'"'+vhost+'"');
		chrome.tabs.executeScript(tabId, {code: code});
	}
}