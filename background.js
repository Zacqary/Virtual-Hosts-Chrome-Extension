var vhost = "";
var ip = "";
var enabled = false;
var requestsToRemap = {};

chrome.webRequest.onBeforeRequest.addListener(
	function(details){
		if (enabled) {
			var domain = details.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
			if (domain === vhost){
				var redirectUrl = details.url.replace(vhost, ip);
				requestsToRemap[redirectUrl] = vhost;
				return {redirectUrl: redirectUrl};
			}	
		}
	},
	{urls: ["<all_urls>"]},
	["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		console.log(details.url);
		if (enabled && requestsToRemap[details.url])
		{
			var remap = requestsToRemap[details.url];
			details.requestHeaders.push({ name: "Host", value: remap });
			delete requestsToRemap[details.url];
			console.log(details.requestHeaders);
			return {requestHeaders: details.requestHeaders};
		}
	},
	{urls: ["<all_urls>"]},
	["blocking", "requestHeaders"]
);