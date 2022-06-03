const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const { request } = require('http');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
//var flash = require('express-flash-messages') 

var routes = require('./routers');

const app = express()
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

app.use(cookieParser('NotSoSecret'));
app.use(session({
	secret: makeid(10),
	resave: true,
	saveUninitialized: true
}));
app.use(flash());

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))


//Set Views
app.set('views', './views')
app.set('view engine', 'ejs')


app.use('/', routes);


// Listem on port 3000
app.listen(port, ()=> 
    console.info(`Server is listened on http://localhost:${port}`))