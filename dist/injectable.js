window.coreflow = {
	options: {
		baseDomain: "https://auth.dappjump.io",
		distLocation: "dist",
		useDistSubfolder: false,
		web3Provided: false
	}
}

coreflow.init = (options, callback)=>{
	if(typeof options == 'object') coreflow.options = {...coreflow.options, ...options};

	if(!coreflow.web3Provided) {
		var s = document.createElement('script');
        s.setAttribute('src', coreflow.options.baseDomain+'/'+coreflow.options.distLocation+(coreflow.options.useDistSubfolder ? '/js/':'/')+'web3.min.js');
        s.onload = coreflow.onReady;
        document.head.appendChild(s);
	} else {
		coreflow.onReady();
	}
}

coreflow.onReady = ()=>{
	console.log("Coreflow is ready")
}