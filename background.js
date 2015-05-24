var requestsToRemap = {};
var requestRecord = {};
var activeTabs = {};
var hostsMap = {};
var hostsFile = '';
var disabledSites = {};
var options = {};

chrome.webRequest.onBeforeRequest.addListener(
	function(details){
		hostsMap = generateHostsMap(hostsFile);
		var domain = details.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
		console.log(details.requestHeaders);
		if (!disabledSites[domain]) {
			// Get the request's domain and compare it to the vhost
			if (hostsMap[domain]){
				// Redirect this request to ip, and prepare to send it with a new Host header
				var redirectUrl = details.url.replace(domain, hostsMap[domain]);
				requestsToRemap[details.requestId] = {vhost: domain};

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
		if (requestsToRemap[details.requestId])
		{
			var remap = requestsToRemap[details.requestId].vhost;
			details.requestHeaders.push({ name: "Host", value: remap });
			// if (details.type === "main_frame"){
			// 	showHostOnPage(details.tabId, remap);
			// 	activeTabs[details.tabId] = remap;
			// 	updateIcon();
			// }
			delete requestsToRemap[details.requestId];
			console.log(details);
			return {requestHeaders: details.requestHeaders};
		} else {
			// if (details.type === "main_frame"){
			// 	console.log(details.requestHeaders);
			// 	activeTabs[details.tabId] = false;
			// 	updateIcon();
			// }
		}
	},
	{urls: ["<all_urls>"]},
	["blocking", "requestHeaders"]
);

function updateBadges(){
	for (var i in requestRecord){
		if (parseInt(i) > -1){
			chrome.tabs.get(parseInt(i), function(tab){
				if (chrome.runtime.lastError){
					return;
				}
				var badgeText = '';
				if (requestRecord[i].length > 0){
					badgeText = requestRecord[i].length.toString();
				}
				chrome.browserAction.setBadgeText({text: badgeText, tabId: tab.id});
			});
		}
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
			}
		})();
	}

	if (tabId > -1){
		var code = hostIndicator.toString().replace('function hostIndicator(){','').slice(0, -1).replace(/vhost/g,'"'+vhost+'"');
		chrome.tabs.executeScript(tabId, {code: code});
	}
}

function updateIcon(){
	chrome.tabs.getSelected(function(tab){
		if (activeTabs[tab.id]){
			chrome.browserAction.setIcon({path: 'active.png'});
		} else {
			var domain = tab.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
			chrome.browserAction.setIcon({path: (disabledSites[domain] ? 'disabled' : 'enabled') + '.png'});
		}
	});
}