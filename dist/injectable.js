window.coreflow = {
	options: {
		baseDomain: "https://auth.dappjump.io",
		distLocation: "dist",
		useDistSubfolder: false,
		web3Provided: false,
		strings: {
			encryptedWalletKey: "coreflow_encrypted_wallet",
			JWTKey: "coreflow_jwt"
		}
	}
}

coreflow.init = (options, callback)=>{
	if(typeof options == 'object') coreflow.options = {...coreflow.options, ...options};

	if(!coreflow.web3Provided) {
		var s = document.createElement('script');
        s.setAttribute('src', coreflow.options.baseDomain+'/'+coreflow.options.distLocation+(coreflow.options.useDistSubfolder ? '/js/':'/')+'web3.min.js');
        s.onload = coreflow.preflight;
        document.head.appendChild(s);
	} else {
		coreflow.preflight();
	}
}

coreflow.preflight = ()=>{
	coreflow.web3 = new Web3();
	coreflow.onReady()
}

coreflow.home = (module, method, payload)=>{
	return new Promise((resolve, reject)=>{
	  	let url = coreflow.options.baseDomain+"/api/"+module+"/v1/"+method;
		var xhttp = new XMLHttpRequest();
		  xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {
		    	return resolve(JSON.parse(this.responseText))
		    }
		    if( this.readyState == 4 && !this.status == 200) {
		    	return reject(JSON.parse(this.responseText))
		    }
		  };
		  xhttp.open((payload ? 'POST' : 'GET'), url, true);
		  if(payload) {
		  	xhttp.setRequestHeader('Content-type', 'application/json');
		  }
		  xhttp.send((payload ? JSON.stringify(payload): null));
	})
}

coreflow.user = {
	wallet: false,
	connectLocalStrategy: ()=>{
		return new Promise((resolve, reject)=>{
			coreflow.user.getChallenge()
				.then((res)=>{
					if(!res.msg) return reject();
					coreflow.user.solveChallenge(res.msg)
						.then((res)=>{
							coreflow.home('user','challenge/'+coreflow.user.wallet.address,res)
								.then((res)=>{
									localStorage.setItem(coreflow.options.strings.JWTKey, res.msg)
									resolve()
								})
								.catch((res)=>{
									reject(res)
								})
						})
						.catch((res)=>{
							reject(res)
						})
				})
				.catch((res)=>{reject(res)})
		})
	},
	getChallenge: ()=>{
		return new Promise((resolve, reject)=>{
			if(!coreflow.user.wallet) return reject();
			coreflow.home('user','challenge/'+coreflow.user.wallet.address)
				.then((code, response)=>{
					resolve(code, response)
				})
				.catch((code, response)=>{
					reject(code, response)
				})
		})
	},
	solveChallenge: (challenge)=>{
		return new Promise((resolve, reject)=>{
			try {
				resolve(coreflow.web3.eth.accounts.sign(challenge, coreflow.user.wallet.privateKey))
			}
			catch(e){
				reject(e)
			}
		})
	},
	unlockLocal: (password)=>{
		return new Promise((resolve, reject)=>{
			setTimeout(function(){
				try {
					let encryptedWallet = localStorage.getItem(encryptedWalletKey);
					if(!encryptedWallet) reject();
					let wallet = coreflow.web3.eth.accounts.decrypt(JSON.parse(encryptedWallet));
					coreflow.user.wallet = wallet;
					localStorage.setItem(coreflow.options.strings.encryptedWalletKey,wallet.encrypt(password));
					return resolve(coreflow.user.wallet);
				} catch(e){
					return reject(e);
				}
			},500)	
		})
	},
	generateLocal: (password)=>{
		return new Promise((resolve, reject)=>{
			setTimeout(function(){
				try {
					let wallet = coreflow.web3.eth.accounts.create();
					coreflow.user.wallet = wallet;
					localStorage.setItem(coreflow.options.strings.encryptedWalletKey,wallet.encrypt(password));
					return resolve(coreflow.user.wallet);
				} catch(e){
					return reject(e);
				}
			},500)	
		})
	}
}

coreflow.modules = {

}

coreflow.api = () => {
	
}

coreflow.onReady = ()=>{
	console.log("Coreflow is ready")
}