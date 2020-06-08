var express = require('express')
var app = express()
const cors = require('cors');

const EthUtil = require('ethereumjs-util');

const User = require('./user');

const Jwt = require('express-jwt');
const JwtGen = require('jsonwebtoken');

app.use(cors())

require('dotenv').config()

const APIVersion = 1;

const requiredRoutes = {
	protected: [
		{
			url: "modules",
			module: "core",
			handler: function(req, res) {

			},
			method: "get",
			description: "GET user's module data (if available)"
		}
	],
	public: [
		{
			url: "",
			module: "core",
			handler: function(req, res){
				res.send(requiredRoutes)
			},
			method: "get",
			description: "GET all available routes"
		},
		{
			url: "challenge/:address?",
			module: "user",
			handler: function(req, res){
				if(!req.params.address) return res.send({code: 400, msg: "Please specify address after method 'challenge/0x00000000000'"})
				User.model.findOne({address:req.params.address}, "address nonce", function(err, user){
					if(!err && user) {
						res.send({user: user.address, challenge:this.loginChallenge({address:user.address,nonce:user.nonce})})
					} else {
						res.send({code: 200, address: userAddress})
					}
				})
			},
			method: "get",
			description: "Request a challenge for either user registration or login"
		},
		{
			url: "challenge/:address?",
			module: "user",
			handler: function(req, res) {
				if(!req.params.address) return res.send({code: 400, msg:"No address specified"})
				if(!req.body.signature) return res.send({code: 400, msg:"No signature attached"})
			},
			method: "post",
			description: "Test challenge and receive JWT token if successful"
		}
	]
}

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/dist/index.html');
})

app.get('/dist/:file', function(req,res){
	res.sendFile(__dirname+'/dist/'+req.params.file)
})

const traverseRoutes = (arr, protected) => {
	for(let index in arr) {
		let route = arr[index]
		route.url = "/api/"+route.module+"/v"+(route.version || APIVersion)+"/" + route.url
		app[route.method](route.url, route.handler);
		console.log(route.method, route.url, (protected ? 'Protected' : 'Public'))
	}
}

const resolveAddressFromSignature = (signature, content)=>{
		return new Promise((resolve, reject)=>{
			var res = EthUtil.fromRpcSig(signature);
			var addr = EthUtil.bufferToHex(EthUtil.pubToAddress(EthUtil.ecrecover(EthUtil.hashPersonalMessage(Buffer.from(content)), res.v, res.r, res.s)));
			if(addr) {
				resolve(addr)
			} else {
				reject()
			}
		})
	}

const signatureMatchesAddress = (address, signature, content) => {
	return new Promise((resolve, reject)=>{
		resolveAddressFromSignature(signature, content)
			.then((resolvedAddress)=>{
				if(address.toLowerCase() == resolvedAddress.toLowerCase()) {
					resolve({
						code: 200,
						msg: "Sender matches declaration",
						address: address.toLowerCase()
					})
				} else {
					reject({
						code: 403,
						msg: "Resolved sender is not as declared"
					})
				}
			})
			.catch(()=>{
				reject({
					code: 400,
					msg: "Failed to unpack signature"
				});
			})
	})
}

traverseRoutes(requiredRoutes.protected, true);
traverseRoutes(requiredRoutes.public);

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI,{useUnifiedTopology: true,useNewUrlParser: true});

app.listen(process.env.PORT || 80)