var express = require('express')
var app = express()
const bodyParser = require('body-parser')
const coreflow = require('./coreflow')

const cors = require('cors');

app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
if(!process.env.PRODUCTION) require('dotenv').config()

/* Supports callback
coreflow.init(app, ()=>{
	app.listen(process.env.PORT || 80)
});
*/

/* And promises */
coreflow.init(app)
	.then(()=>{
		app.listen(process.env.PORT || 80)
	})
	.catch(()=>{})