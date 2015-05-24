window.addEventListener("load", function(e){
  getHostsFile(function(file){
    document.querySelector('textarea').value = file;
    document.querySelector('textarea').addEventListener('keyup',function(e){
	  	setHostsFile(e.target.value);
	  	console.log(vHost.hostsFile);
	  });
  });
});