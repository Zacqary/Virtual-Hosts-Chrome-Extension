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
					var root = indicator.createShadowRoot();
					root.innerHTML = "<style>" +
									 ":host { " +
									 	"display: block;" +
									 	"position: fixed;" +
									 	"top: 10px;" +
									 	"right: 10px;" +
									 	"z-index: 999999999;" +
									 	"background: #555;" +
									 	"color: white;" +
									 	"padding: 10px;" +
									 	"border-radius: 10px;" +
									 	"opacity: 0.9;" +
									 	"font-size: 18px;" +
									 	"font-family: Helvetica, Arial, sans-serif;" +
									 	"-webkit-user-select: none;"+
									 	"pointer-events: none;" +
									 	"transition-duration: 0.1s;" +
									 "}" +
									 "</style>" +
									 "<content></content>";
					window.addEventListener('mousemove', function(e){
						var xBound = window.innerWidth - 10 - indicator.offsetWidth;
						var yBound = 10 + indicator.offsetHeight;
						if (e.clientX > xBound && e.clientY < yBound){
							indicator.style.opacity = "0.1";
						} else {
							indicator.style.opacity = "0.9";
						}
					});
					document.body.appendChild(window.vHostIndicator);
					console.log(indicator);
				}
			})();
		}
		var code = hostIndicator.toString().replace('function hostIndicator(){','').slice(0, -1).replace(/vhost/g,'"'+vhost+'"');
		chrome.tabs.executeScript(tabId, {code: code});
	}
}