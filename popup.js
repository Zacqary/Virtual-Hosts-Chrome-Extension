window.addEventListener("load", function(e)
{
// 	var ip = document.querySelector('#ip_address');
// 	var vn = document.querySelector('#vhost_name');
// 	ip.addEventListener("keyup", update);
// 	vn.addEventListener("keyup", update);
// 	ip.value = chrome.extension.getBackgroundPage().ip;
// 	vn.value = chrome.extension.getBackgroundPage().vhost;
// 	var ve = document.querySelector('#vhost_enable');
// 	ve.addEventListener("change", tick);
// 	ve.checked = chrome.extension.getBackgroundPage().enabled ? true : false;
// 	chrome.browserAction.setIcon({path: (chrome.extension.getBackgroundPage().enabled ? 'enabled' : 'disabled') + '.png'});

	updatePopup();

	document.querySelector('#site-enable-btn').addEventListener('mousedown', siteEnableHandler);
	document.querySelector('#show-hostname-btn').addEventListener('mousedown', showHostnameHandler);
	document.querySelector('#show-number-btn').addEventListener('mousedown', showNumberHandler);
	document.querySelector('#config-btn').addEventListener('mousedown', showConfig);
}, false);

function update(e)
{
	chrome.extension.getBackgroundPage()[e.target.name] = e.target.value;
	chrome.extension.getBackgroundPage().enabled = true;
	document.getElementById("vhost_enable").checked = true;
	chrome.browserAction.setIcon({path: 'enabled.png'});
	var hostsFile = e.target.value.split('\n');
	var mappings = {};
	hostsFile.forEach(function(o, i){
		if (o[0] !== "#" && o[0] !== ''){
			chrome.extension.getBackgroundPage().console.log(o);
			var match = o.match(/([A-Z0-9.\-:%]*)(\s*)?(\n?)/ig);
			chrome.extension.getBackgroundPage().console.log(match);
			for (var x = 1; x < match.length; x++){
				if (match[x] !== ''){
					mappings[match[x].replace(/\s/g,'')] = match[0].replace(/\s/g,'');
				}
			}
		}
	});
	chrome.extension.getBackgroundPage().console.log(mappings);
}

function tick(e)
{
	chrome.extension.getBackgroundPage().enabled = e.target.checked;
	chrome.browserAction.setIcon({path: (e.target.checked ? 'enabled' : 'disabled') + '.png'});
}

function updatePopup(){
	updateSiteEnable();
	updateShowHostname();
	updateShowNumber();
	updateIcon();
}


function updateIcon(){
	chrome.tabs.getSelected(function(tab){
		var domain = tab.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
		getDisabledSites(function(items){
			chrome.browserAction.setIcon({path: (items[domain] ? 'disabled' : 'enabled') + '.png'});
		});
	});
}

// Enable on this site
// ===================
function siteEnableHandler(e){
	var span = e.target.querySelector('span');
	chrome.tabs.getSelected(function(tab){
		var domain = tab.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
		getDisabledSites(function(items){
			if (items[domain]){
				setSiteEnabled(span,true);
				delete items[domain];
			} else {
				setSiteEnabled(span,false);
				items[domain] = true;
			}
			setDisabledSites(items);
		});
	});
}
function setSiteEnabled(span, enabled){
	if (enabled){
		span.className = "enabled";
		span.innerHTML = "Enable";
	} else {
		span.className = "disabled";
		span.innerHTML = "Disable";
	}
	updateIcon();
}
function updateSiteEnable(){
	var btn = document.querySelector('#site-enable-btn');
	var vhostDisplay = document.querySelector('h4');
	chrome.tabs.getSelected(function(tab){
		if (tab.url.match(/chrome.*?:\/\//)){
			btn.style.display = "none";
			vhostDisplay.style.display = "none";
		}
		else {
			btn.style.display = "block";
			vhostDisplay.style.display = "block";
			var domain = tab.url.match(/^(?:https?:\/\/)?([^\/:]+)/i)[1];
			getDisabledSites(function(items){
				if (items[domain]){
					setSiteEnabled(btn.querySelector('span'),false);
				} else {
					setSiteEnabled(btn.querySelector('span'),true);
				}
			});
		}
	});
}


// Show hostname in corner
// =======================
function showHostnameHandler(e){
	var span = e.target.querySelector('span');
	getOptions(function(options){
		console.log(options);
		if (options.showHostname){
			setShowHostname(span, false);
			options.showHostname = false;
		} else {
			setShowHostname(span, true);
			options.showHostname = true;
		}
		setOptions(options);
	});
}
function setShowHostname(span, enabled){
	if (enabled){
		span.className = "enabled";
		span.innerHTML = "Show";
	} else {
		span.className = "disabled";
		span.innerHTML = "Hide";
	}
}
function updateShowHostname(){
	var span = document.querySelector('#show-hostname-btn span');
	getOptions(function(options){
		if (options.showHostname){
			setShowHostname(span,true);
		} else {
			setShowHostname(span,false);
		}
	});
}

// Show number in icon
// =======================
function showNumberHandler(e){
	var span = e.target.querySelector('span');
	getOptions(function(options){
		console.log(options);
		if (options.showNumber){
			setShowNumber(span, false);
			options.showNumber = false;
		} else {
			setShowNumber(span, true);
			options.showNumber = true;
		}
		setOptions(options);
	});
}
function setShowNumber(span, enabled){
	if (enabled){
		span.className = "enabled";
		span.innerHTML = "Show";
	} else {
		span.className = "disabled";
		span.innerHTML = "Hide";
	}
}
function updateShowNumber(){
	var span = document.querySelector('#show-number-btn span');
	getOptions(function(options){
		if (options.showNumber){
			setShowNumber(span,true);
		} else {
			setShowNumber(span,false);
		}
	});
}

// Options
// =======
function showConfig(){
	chrome.tabs.create({'url': chrome.extension.getURL('config.html')}, function(tab) {
	  // Tab opened.
	});
}