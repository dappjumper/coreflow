var express = require('express')
var app = express()
const cors = require('cors');
const EthUtil = require('ethereumjs-util');
const User = require('./user');
const Jwt = require('express-jwt');
const JwtGen = require('jsonwebtoken');
const version = require('./package.json').version;

const httpFeedback = (code, customMessage)=>{
	let chunk = {
		code: code,
		msg: customMessage || "Something went wrong..."
	}
	switch(code) {
		case 400:
			chunk.msg = "Bad input data"
		break;
		case 404:
			chunk.msg = "Resource not found"
		break;
		case 500:
			chunk.msg = "Something went wrong..."
		break;
	}
	return chunk;
}

app.use(cors())

require('dotenv').config()

const APIVersion = version.split('.')[0];

const loginChallenge = (user, service)=>{
	return "I hereby sign that I am trying to log onto a dappjump.io "+service+" service. #"+(user.nonce || '0')+"  "+user.address
}

const registrationChallenge = (user, service)=>{
	return "I hereby sign that I am trying to register on a dappjump.io "+service+" service. #0 "+user
}

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
			url: "version",
			module: "info",
			handler: function(req, res){
				res.send(version)
			},
			method: "get",
			description: "Accurate version of Coreflow"
		},
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
				if(!req.params.address) return res.send(httpFeedback(404))
				if(req.params.address.length !== 42) return res.send(httpFeedback(400))
				User.model.findOne({address:req.params.address}, "address nonce", function(err, user){
					if(!err && user) {
						res.send({code: 200, msg: loginChallenge(user, "user")})
					} else {
						res.send({code: 200, msg: registrationChallenge(req.params.address, "user")})
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