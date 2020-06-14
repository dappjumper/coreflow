<a href="http://auth.dappjump.io"><img src="https://github.com/dappjumper/coreflow/blob/master/dist/logo.png" title="Auth Server" alt="Auth Server"></a>
> Self-contained NodeJS and MongoDB user system designed to be a micro-service for authorization via Ethereum signatures.

<img src="https://img.shields.io/github/package-json/keywords/dappjumper/coreflow?style=for-the-badge"> <img src="https://img.shields.io/github/package-json/v/dappjumper/coreflow?style=for-the-badge"> 

<p align="center"><img src="https://github.com/dappjumper/coreflow/blob/master/dist/readme_hero_v2.png" title="Microservice architecture" alt="Microservice architecture"></p>

# Installing

- Clone this repository
- Set environment variables seen below
- Install as any other NodeJS application either locally or on a host of your choice

## Environment variables (configuration is key)
<a href="https://github.com/dappjumper/coreflow/blob/master/.env.sample">Grab sample .env file</a>

- **JWTSECRET** *May also be used for non-jwt encryption, so make it count!*  
`<LONG SECRET>`  

- **MONGODB_URI**  
`mongodb+srv://...`  

- **PORT**  
`80`  

- **REGISTRATION_CHALLENGE** *Automatically replaces `<TAG>` with proper value*  
`I wish to register on <DOMAIN> with the address <ADDRESS>`  

- **LOGIN_CHALLENGE** *Automatically replaces `<TAG>` with proper value*  
`I wish to login on <DOMAIN> with the address <ADDRESS> with nonce <NONCE>`  

- **DOMAIN**  *Used in challenge strings and more*  
`coreflow.js`  

## Configuration
When invoking injectable.js you can provide a few modifications to suit your deployment environment
```
baseDomain: "https://auth.dappjump.io",
distLocation: "dist",
useDistSubfolder: false,
web3Provided: false,
strings: {
	encryptedWalletKey: "coreflow_encrypted_wallet",
	JWTKey: "coreflow_jwt",
	address: "coreflow_adress"
}
```

## Endpoints

### Public

`get /api/info/v1/version`  *Get API Version (from package.json)*

`get /api/core/v1/`  *Get a list of all available endpoints*

`get /api/user/v1/challenge/:address?`  *Send address and receive either login or registration challenge*

`post /api/user/v1/challenge/:address?`  *Send solved challenge and receive JWT Token for Authorization header*

### Protected

`get /api/user/v1/profile`  *Get all user data*