module.exports = {
    steam_app: function() {
        const SteamUser = require("steam-user");
        const mysql = require('mysql');
        var express = require('express'),
            app = express();
        
        const connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : '',
            database : 'nodelogin'
        });


        const title = "test";
        const games = 720;
        connection.query('SELECT * FROM steam_accounts WHERE username = ?', 
			[req.session.username], function(error, result, fields){
                if(error){console.log(error)}
                if(result.length === 0){
					console.log("[!] No steam account added");
				}
                let steamUsername = result[0].steam_username;
                let steamPassword = result[0].steam_password;
            });

        app.get('/app/test', (req, res) =>{
					client.logOn({
						accountName: steamUsername,
						password: steamPassword
					});
					process.on('uncaughtException', function (InvalidPassword) {
						console.log("[!] Invalid Password!");
					});
					process.on('uncaughtException', function (RateLimitExceeded) {
						console.log("[!] Rate limit exceeded. Try later!");
					});
					client.on("loggedOn", async () => {
						await client.setPersona(
							SteamUser.EPersonaState.Online
						);
						await client.gamesPlayed(
							title
						);
						console.log(`[!] Logged succesfully as ${steamUsername}.`);
					});
					console.log("Your steam username is:", steamUsername);
					res.redirect('back');
			
        })
    }
}

