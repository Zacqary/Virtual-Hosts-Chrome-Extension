getHostsFile(function(file){
	chrome.extension.getBackgroundPage().hostsFile = file;
});
getDisabledSites(function(sites){
	chrome.extension.getBackgroundPage().disabledSites = sites;
});
getOptions(function(opts){
	chrome.extension.getBackgroundPage().options = opts;
});


function getDisabledSites(callback){
	try {
		chrome.storage.sync.get('disabledSites', function(items){
			if (!items.disabledSites){
				setDisabledSites({});
				callback({});
			} else {
				callback(items.disabledSites);
			}
		});
	} catch(e) {
		setDisabledSites({});
		callback({});
	}
}
function setDisabledSites(items){
	chrome.storage.sync.set({disabledSites: items});
	chrome.extension.getBackgroundPage().disabledSites = items;
}

function getOptions(callback){
	var defaultOptions = {
		showHostname: true,
		showNumbers: true
	};
	try {
		chrome.storage.sync.get('options', function(items){
			if(!items.options){
				setOptions(defaultOptions);
				callback(defaultOptions);
			} else {
				callback(items.options);
			}
		});
	} catch(e) {
		setOptions(defaultOptions);
		callback({
			showHostname: true,
			showNumbers: true
		});
	}
}
function setOptions(items){
	chrome.storage.sync.set({options: items});
	chrome.extension.getBackgroundPage().options = items;
}

function getHostsFile(callback){
	try {
		chrome.storage.local.get('hostsFile', function(items){
			if(!items.hostsFile){
				setHostsFile(defaultHostsFile());
				callback(defaultHostsFile());
			} else {
				callback(items.hostsFile);
			}
		});
	} catch(e) {
		setHostsFile(defaultHostsFile());
		callback(defaultHostsFile());
	}
}

function setHostsFile(file){
	chrome.storage.local.set({hostsFile: file});
	chrome.extension.getBackgroundPage().hostsFile = file;
}

function defaultHostsFile(){
	return  "##\n"+
			"# Virtual Hosts Database\n"+
			"#\n"+
			"# Map IP addresses to hostnames using standard hostfile syntax, like this:\n"+
			"# 127.0.0.1 example.com\n"+
			"# 0.0.0.0 second-example.net third-example.org\n" 
}

function generateHostsMap(file){
	var hosts = file.split('\n');
	var mappings = {};
	hosts.forEach(function(o, i){
		if (o[0] !== "#" && o[0] !== ''){
			var match = o.match(/([A-Z0-9.\-:%]*)(\s*)?(\n?)/ig);
			for (var x = 1; x < match.length; x++){
				if (match[x] !== ''){
					mappings[match[x].replace(/\s/g,'')] = match[0].replace(/\s/g,'');
				}
			}
		}
	});
	return mappings;
}