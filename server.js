var express = require('express')
var app = express()
const bodyParser = require('body-parser')


const cors = require('cors');
const EthUtil = require('ethereumjs-util');
const User = require('./user');
const Jwt = require('express-jwt');
const JwtGen = require('jsonwebtoken');
const version = require('./package.json').version;

const httpCodes = {
	"200": "Success"
	"400": "Bad input data",
	"404": "Resource not found",
	"500": "Something went wrong..."
}

const httpFeedback = (code, customMessage)=>{
	/*
		Standardized responses for http
		code: HTTP Status code
		customMessage: Overwrite default message
		returns {code, msg}
	*/
	let chunk = {
		code: code,
		msg: httpCodes[code] ? httpCodes[code] : "Undefined error"
	}
	return chunk;		
}

app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
if(!process.env.PRODUCTION) require('dotenv').config()

const APIVersion = version.split('.')[0];

const populateStr = (str, tags)=>{
	let returnStr = str;
	for(let tag in tags) {
		returnStr = returnStr.replace(tags[tag][0],tags[tag][1])
	}
	return returnStr
}

const loginChallenge = (user, service)=>{
	let str = process.env.LOGIN_CHALLENGE || "I hereby sign that I am trying to log onto a <DOMAIN> <SERVICE> service. #<NONCE>  <ADDRESS>"
	return populateStr(str, [
		["<ADDRESS>",user.address],
		["<NONCE>",user.nonce || 0],
		["<SERVICE>",service],
		["<DOMAIN>",process.env.DOMAIN || "coreflow.js"]
	])
}

const registrationChallenge = (user, service)=>{
	let str = process.env.REGISTRATION_CHALLENGE || "I hereby sign that I am trying to register on a <DOMAIN> <SERVICE> service. #0 <ADDRESS>"
	return populateStr(str, [
		["<ADDRESS>",user],
		["<SERVICE>",service],
		["<DOMAIN>",process.env.DOMAIN || "coreflow.js"]
	])
}

const requiredRoutes = {
	protected: [
		{
			url: "profile",
			module: "user",
			handler: function(req, res) {
				User.model.findOne({address:req.user.address}, function(err, user){
					if(!err && user) {
						res.status(200).send(httpFeedback(200, user))
					} else {
						res.send(httpFeedback(404))
					}
				})
			},
			method: "get",
			description: "GET user's data (if available)"
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
						res.send(httpFeedback(200, loginChallenge(user, "user")))
					} else {
						res.send(httpFeedback(200, registrationChallenge(req.params.address, "user")))
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
				if(!req.params.address) return res.send(httpFeedback(400))
				if(!req.body.signature) return res.send(httpFeedback(400))
				User.model.findOne({address:req.params.address}, "address nonce", function(err, user){
					let content = ""
					if(!err && user) {
						content = loginChallenge(user,"user")
					} else {
						content = registrationChallenge(req.params.address, "user")
					}
					signatureMatchesAddress(req.params.address, req.body.signature, content)
						.then((result)=>{
							User.model.updateOne({
								address: result.address
							}, {
								$set: {address:result.address}, $inc:{nonce: 1}, $setOnInsert: {created: new Date().getTime()}
							}, {upsert:true}
							, function(err, user){
								JwtGen.sign({ address: result.address }, process.env.JWTSECRET || "supersecret", function(err, token) {
								  	if(err) return res.send(httpFeedback(500))
									res.send(httpFeedback(200, token))
								});
							})
						})
						.catch(()=>{
							res.send(httpFeedback(400))
						})
				})
			},
			method: "post",
			description: "Test challenge and receive JWT token if successful"
		}
	]
}



app.get('/dist/:file', function(req,res){
	res.sendFile(__dirname+'/dist/'+req.params.file)
})

if(process.env.STANDALONE) {
	app.get('/', function(req, res) {
	res.sendFile(__dirname+'/dist/standalone/index.html');
})
} else {
	app.get('/', function (req, res) {
	  res.sendFile(__dirname+'/dist/index.html');
	})
}

const traverseRoutes = (arr, protected) => {
	for(let index in arr) {
		let route = arr[index]
		route.url = "/api/"+route.module+"/v"+(route.version || APIVersion)+"/" + route.url
		if(protected) {
			app[route.method](route.url, Jwt({secret: process.env.JWTSECRET }), route.handler)
		} else {
			app[route.method](route.url, route.handler);
		}
		console.log(route.method, route.url, (protected ? 'Protected' : 'Public'))
	}
}

const protected = function(req,res,next){
	if(req.user){
		next();
	} else {
		res.status(500).json({error:'login is required'});
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