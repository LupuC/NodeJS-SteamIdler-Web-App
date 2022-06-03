var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const session = require('express-session');
const path = require('path');
const {
	request
} = require('http');
const SteamUser = require("steam-user");
const {
	InvalidPassword, RateLimitExceeded
} = require('steam-user/enums/EResult');
const { restart } = require('nodemon');

//Mysql Connection
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'nodelogin'
});

router.get('', (req, res, next) => {
	res.render('index', {
		user: req.session.username
	})
})


//Login Page
router.get('/login', (req, res) => {
	if (!req.session.username){
		res.render('login')
	}else{
		res.redirect('/app')
	}
});
//Login Page- Login Function
router.post('/auth', function(req, res) {
	// Capture the input fields
	let username = req.body.username;
	let password = req.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				req.session.loggedin = true;
				req.session.username = username;
				// Redirect to home page
				return res.redirect('/app');
			} else {
				res.send('Incorrect Username and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});
//Logout Function
router.get('/logout', (req, res) => {
	if (req.session) {
		req.session.destroy(err => {
		  if (err) {
			res.status(400).send('Unable to log out')
		  } else {
			res.redirect('/')
		  }
		});
	  } else {
		res.end()
	  }
});



//Register Page
router.get('/join', (req, res) => {
	if (!req.session.username){
		res.render('join')
	}else{
		res.redirect('/app')
	}
})
//Register Page - Register Function
router.post('/register', function(req, res) {
	// Capture the input fields
	let username = req.body.username;
	let password = req.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		connection.query('SELECT username FROM accounts WHERE username = ?', [username], function(error, result, fields) {
			if (result.length === 0) {
				var sql = "INSERT INTO accounts (username, password) VALUES (?)"
				var values = [username, password];
				var new_query = sql + values;
				connection.query(sql, [values], function(error, result) {
					if (error) console.log(error);
				});
				return res.redirect('/');
			} else {
				res.send('User already exists!');
			}
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

router.get('/pricing', (req, res) => {
	res.render('pricing', {
		user: req.session.username
	})
})
router.get('/features', (req, res) => {
	res.render('features', {
		user: req.session.username
	})
})
router.get('/support', (req, res) => {
	res.render('support', {
		user: req.session.username
	})
})


//Auth/ session redirect - Main App
router.get('/app', (req, res) => {
	connection.query('SELECT * FROM accounts WHERE username = ?',
		[req.session.username],
		function(error, result, fields) {
			planType = result[0].plan;
			if (planType === "free") {
				connection.query('SELECT * FROM steam_accounts_free WHERE username = ?',
					[req.session.username],
					function(error, result, fields) {
						if (result.length === 0) {
							let steamUsername = "N/A";
							let timeLeft = "0";
							let statusFree = "Inactive";
							if (req.session.loggedin) {
								// Output username
								res.render('app', {
									user: req.session.username,
									steamUser: steamUsername,
									timeLeft: timeLeft,
									statusFree: statusFree
								})
							} else {
								// Not logged in
								res.send('Please login to view this page!');
							}
							res.end();
						} else {
							let steamUsername = result[0].steam_username;
							let timeLeft = result[0].time_left;
							let statusFree = result[0].status;
							if (req.session.loggedin) {
								// Output username
								res.render('app', {
									user: req.session.username,
									steamUser: steamUsername,
									timeLeft: timeLeft,
									statusFree: statusFree
								})
							} else {
								// Not logged in
								res.send('Please login to view this page!');
							}
							res.end();
						}

					});
			} else {
				connection.query('SELECT * FROM steam_accounts_free WHERE username = ?',
					[req.session.username],
					function(error, result, fields) {
						if (result.length === 0) {
							let steamUsername = "N/A";
							let timeLeft = "0";
							let statusFree = "Inactive";
							connection.query('SELECT * FROM steam_accounts_premium WHERE username = ?',
								[req.session.username],
								function(error, result, fields) {
									if (result.length === 0) {
										let steamUsername_premium = "N\A";
										let timeLeft_premium = "0";
										let statusPremium = "Inactive";
										if (req.session.loggedin) {
											// Output username
											res.render('app', {
												user: req.session.username,
												steamUser: steamUsername,
												timeLeft: timeLeft,
												statusFree: statusFree,
												steamUser_premium: steamUsername_premium,
												timeLeft_premium: timeLeft_premium,
												statusPremium: statusPremium
											})
										} else {
											// Not logged in
											res.send('Please login to view this page!');
										}
										res.end();
									} else {
										let steamUsername_premium = result[0].steam_username;
										let timeLeft_premium = result[0].time_left;
										let statusPremium = result[0].status;
										if (req.session.loggedin) {
											// Output username
											res.render('app', {
												user: req.session.username,
												steamUser: steamUsername,
												timeLeft: timeLeft,
												statusFree: statusFree,
												steamUser_premium: steamUsername_premium,
												timeLeft_premium: timeLeft_premium,
												statusPremium: statusPremium
											})
										} else {
											// Not logged in
											res.send('Please login to view this page!');
										}
										res.end();
									}

								});
						} else {
							let steamUsername = result[0].steam_username;
							let timeLeft = result[0].time_left;
							let statusFree = result[0].status;
							connection.query('SELECT * FROM steam_accounts_premium WHERE username = ?',
								[req.session.username],
								function(error, result, fields) {
									if (result.length === 0) {
										let steamUsername_premium = "N\A";
										let timeLeft_premium = "0";
										let statusPremium = "Inactive"
										if (req.session.loggedin) {
											// Output username
											res.render('app', {
												user: req.session.username,
												steamUser: steamUsername,
												timeLeft: timeLeft,
												statusFree: statusFree,
												steamUser_premium: steamUsername_premium,
												timeLeft_premium: timeLeft_premium,
												statusPremium: statusPremium
											})
										} else {
											// Not logged in
											res.send('Please login to view this page!');
										}
										res.end();
									} else {
										let steamUsername_premium = result[0].steam_username;
										let timeLeft_premium = result[0].time_left;
										let statusPremium = result[0].status;
										if (req.session.loggedin) {
											// Output username
											res.render('app', {
												user: req.session.username,
												steamUser: steamUsername,
												timeLeft: timeLeft,
												statusFree: statusFree,
												steamUser_premium: steamUsername_premium,
												timeLeft_premium: timeLeft_premium,
												statusPremium: statusPremium
											})
										} else {
											// Not logged in
											res.send('Please login to view this page!');
										}
										res.end();
									}

								});
						}

					});
			}
		});

})


router.post('/app/account', (req, res) => {
	let steamUsername = req.body.SteamUsername;
	let steamPassword = req.body.SteamPassword;
	// Ensure the input fields exists and are not empty
	if (steamUsername && steamPassword) {
		var sql = "INSERT INTO steam_accounts_free (username, steam_username, steam_password) VALUES (?)"
		var values = [req.session.username, steamUsername, steamPassword];
		var new_query = sql + values;
		connection.query(sql, [values], function(error, result) {
			if (error) console.log(error);
			return res.redirect('back');
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
})
router.post('/app/premium_account', (req, res) => {
	let steamUsername = req.body.SteamUsername;
	let steamPassword = req.body.SteamPassword;
	// Ensure the input fields exists and are not empty
	if (steamUsername && steamPassword) {
		var sql = "INSERT INTO steam_accounts_premium (username, steam_username, steam_password, plan) VALUES (?)"
		var values = [req.session.username, steamUsername, steamPassword, "premium"];
		var new_query = sql + values;
		connection.query(sql, [values], function(error, result) {
			if (error) console.log(error);
			return res.redirect('back');
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
})


let accounts = {};
let title = "Test";
function loginAccount(accountName, password, twoFactorCode) {
  if (accounts[accountName]) {
	process.on('uncaughtException', function(Error) {
		console.log(`[!] ${accountName} is already running!`);
		});
  }
  let user = new SteamUser();
  accounts[accountName] = user;
  user.logOn({
    accountName,
    password,
	twoFactorCode
  });

process.on('uncaughtException', function(InvalidPassword) {
	console.log("[!] Invalid Password!");
	accounts[accountName].logOff();
	accounts[accountName] = null;
});
process.on('uncaughtException', function(RateLimitExceeded) {
	console.log("[!] Rate limit exceeded. Try later!");
});
  user.on("loggedOn", async () => {
	await user.setPersona(
		SteamUser.EPersonaState.Online
	);
	await user.gamesPlayed(
		title
	);
	console.log(`\n[!] Logged succesfully as ${accountName}.`);
  });
}
function logoutAccount(accountName) {
  if (!accounts[accountName]) {
	process.on('uncaughtException', function(Error) {
		console.log(`[!] ${accountName} is not running!`);
		});
  }
  if(RateLimitExceeded){
	process.on('uncaughtException', function(Error) {
		console.log("[!] Rate limit exceeded. Try later!");
	  });
  }
  accounts[accountName].logOff();
  accounts[accountName] = null;
  console.log(`[!] Logged off succesfully from ${accountName}.`);
}


router.post('/app/start_free', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_free WHERE username = ?',
	[req.session.username], function(error, result, fields) {
		process.on('uncaughtException', function(error) {
			console.log(`[!] Error - ${error}`);
			res.redirect('back');
			});
		if (result.length === 0) {
			console.log("[!] No steam account added!");
			return res.redirect('back');
		} else {
			connection.query('UPDATE steam_accounts_free SET status="Starting..." WHERE username = ?',
			[req.session.username], function(error, result, fields) {
			});
			let steamUsername = result[0].steam_username;
			let steamPassword = result[0].steam_password;
			let steamguard = req.body.SteamGuard;
			loginAccount(steamUsername, steamPassword, steamguard);
			return res.redirect('back');
		}
	});
})
router.post('/app/stop_free', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_free WHERE username = ?',
	[req.session.username],
	function(error, result, fields) {
		if (error) {
			console.log(error)
			return res.redirect('back');
		}
		if (result.length === 0) {
			console.log("[!] No steam account added!");
			return res.redirect('back');
		} else {
			let steamUsername = result[0].steam_username;
			logoutAccount(steamUsername);
			connection.query('UPDATE steam_accounts_free SET status="inactive" WHERE username = ?',
			[req.session.username], function(error, result, fields) {
			});
			return res.redirect('back');
		}
	});
})
router.post('/app/steamguard', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_free WHERE username = ?',
		[req.session.username],
		function(error, result, fields) {
			if (error) {
				console.log(error)
			}
			let steamUsername = result[0].steam_username;
			let steamPassword = result[0].steam_password;
			let steamguard = req.body.SteamGuard;
			if (result.length === 0) {
				console.log("[!] No steam account added");
			} else {
				user.logOn({
					accountName: steamUsername,
					password: steamPassword,
					twoFactorCode: steamguard
				});
				process.on('uncaughtException', function(InvalidPassword) {
					console.log("[!] Invalid Password!");
				});
				process.on('uncaughtException', function(RateLimitExceeded) {
					console.log("[!] Rate limit exceeded. Try later!");
				});
				connection.query('UPDATE steam_accounts_free SET status="Started" WHERE username = ?',
				[req.session.username], function(error, result, fields) {
				});
				return res.redirect('back');
			}
		});
})
router.post('/app/reset_free', (req, res) => {
	connection.query('UPDATE steam_accounts_free SET status="inactive" WHERE username = ?',
	[req.session.username], function(error, result, fields) {
	});
	return res.redirect('back');
})
router.post('/app/remove_account_free', (req, res) => {
	connection.query('DELETE FROM steam_accounts_free WHERE username = ?',
	[req.session.username], function(error, result, fields) {
	});
	return res.redirect('back');
})


router.post('/app/start_premium', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_premium WHERE username = ?',
	[req.session.username], function(error, result, fields) {
		process.on('uncaughtException', function(error) {
			console.log(`[!] Error - ${error}`);
			res.redirect('back');
			});
		if (result.length === 0) {
			console.log("[!] No steam account added!");
			return res.redirect('back');
		} else {
			connection.query('UPDATE steam_accounts_premium SET status="Starting..." WHERE username = ?',
			[req.session.username], function(error, result, fields) {
			});
			let steamUsername = result[0].steam_username;
			let steamPassword = result[0].steam_password;
			let steamguard = req.body.SteamGuard;
			loginAccount(steamUsername, steamPassword, steamguard);
			return res.redirect('back');
			
		}
	});
})
router.post('/app/stop_premium', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_premium WHERE username = ?',
	[req.session.username],
	function(error, result, fields) {
		if (error) {
			console.log(error)
			return res.redirect('back');
		}
		if (result.length === 0) {
			console.log("[!] No steam account added!");
			return res.redirect('back');
		} else {
			let steamUsername = result[0].steam_username;
			logoutAccount(steamUsername);
			connection.query('UPDATE steam_accounts_premium SET status="inactive" WHERE username = ?',
			[req.session.username], function(error, result, fields) {
			});
			return res.redirect('back');
		}
	});
})
router.post('/app/steamguard_premium', (req, res) => {
	connection.query('SELECT * FROM steam_accounts_premium WHERE username = ?',
		[req.session.username],
		function(error, result, fields) {
			if (error) {
				console.log(error)
			}
			let steamUsername = result[0].steam_username;
			let steamPassword = result[0].steam_password;
			let steamguard = req.body.SteamGuard;
			if (result.length === 0) {
				console.log("[!] No steam account added");
			} else {
				user.logOn({
					accountName: steamUsername,
					password: steamPassword,
					twoFactorCode: steamguard
				});
				process.on('uncaughtException', function(InvalidPassword) {
					console.log("[!] Invalid Password!");
				});
				process.on('uncaughtException', function(RateLimitExceeded) {
					console.log("[!] Rate limit exceeded. Try later!");
				});
				connection.query('UPDATE steam_accounts_premium SET status="Started" WHERE username = ?',
				[req.session.username], function(error, result, fields) {
				});
				return res.redirect('back');
			}
		});
})
router.post('/app/reset_premium', (req, res) => {
	connection.query('UPDATE steam_accounts_premium SET status="inactive" WHERE username = ?',
	[req.session.username], function(error, result, fields) {
	});
	return res.redirect('back');
})
router.post('/app/remove_account_premium', (req, res) => {
	connection.query('DELETE FROM steam_accounts_premium WHERE username = ?',
	[req.session.username], function(error, result, fields) {
	});
	return res.redirect('back');
})


module.exports = router;