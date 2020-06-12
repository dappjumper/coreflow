<a href="http://auth.dappjump.io"><img src="https://github.com/dappjumper/coreflow/blob/master/dist/logo.png" title="Auth Server" alt="Auth Server"></a>
> Self-contained NodeJS and MongoDB user system designed to be a micro-service for authorization via Ethereum signatures.

<img src="https://img.shields.io/github/package-json/keywords/dappjumper/coreflow?style=for-the-badge"> <img src="https://img.shields.io/github/package-json/v/dappjumper/coreflow?style=for-the-badge"> 

<p align="center"><img src="https://github.com/dappjumper/coreflow/blob/master/dist/readme_hero_v2.png" title="Microservice architecture" alt="Microservice architecture"></p>

# Installing

- Clone this repository
- Set environment variables seen below
- Install as any other NodeJS application either locally or on a host of your choice

## Environment variables (configuration is key)

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

## Modules

### Core
```JavaScript
get /api/core/v1/modules //Get all installed modules
get /api/core/v1/ //See all available endpoints
```
### User
```JavaScript
get /api/user/v1/challenge/:address? //Get either a login or registration challenge to be signed by the client
post /api/user/v1/challenge/:address? //Submit your signed challenge for verification (returns JWT Token)
```

### Info
```JavaScript
get /api/info/v1/version //Get the full version of your Coreflow server
```