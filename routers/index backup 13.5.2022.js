var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const session = require("express-session");
const path = require("path");
const { request } = require("http");
const SteamUser = require("steam-user");
const {
  InvalidPassword,
  RateLimitExceeded,
} = require("steam-user/enums/EResult");
const { restart } = require("nodemon");
const bcrypt = require("bcryptjs");
const flash = require("express-flash-messages");

const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const initVectorString = "1234567890zxcvbn";
const SecuritykeyString = "1234567890zxcvbn1234567890zxcvbn";
const initVector = Buffer.from(initVectorString, "utf-8");
const Securitykey = Buffer.from(SecuritykeyString, "utf-8");

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
  let encryptedData = cipher.update(text, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData;
}
function decrypt(text) {
  const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
  let decryptedData = decipher.update(text, "hex", "utf-8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
}

//Mysql Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodelogin",
});

router.get("", (req, res, next) => {
  res.render("index", {
    user: req.session.username,
  });
});

//Login Page
router.get("/login", (req, res, next) => {
  if (!req.session.username) {
    res.render("login", { loginError: req.flash("loginError") });
  } else {
    res.redirect("/app");
  }
});

//Login Page- Login Function
router.post("/auth", function (req, res, next) {
  // Capture the input fields
  let username = req.body.username;
  let password = req.body.password;
  // Ensure the input fields exists and are not empty
  if (username && password) {
    // Execute SQL query that'll select the account from the database based on the specified username and password
    connection.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          let pwResult = results[0].password;
          const verified = bcrypt.compareSync(password, pwResult);
          if (verified == true) {
            req.session.loggedin = true;
            req.session.username = username;
            return res.redirect("/app");
          } else {
            req.flash("loginError", "Incorrect password");
            res.redirect("/login");
          }
        } else {
          req.flash("loginError", "Incorrect username");
          res.redirect("/login");
        }
        res.end();
      }
    );
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});
//Logout Function
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(400).send("Unable to log out");
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.end();
  }
});

//Test Page
router.get("/test", (req, res) => {
  res.render("test");
});

//Register Page
router.get("/join", (req, res) => {
  if (!req.session.username) {
    res.render("join");
  } else {
    res.redirect("/app");
  }
});
//Register Page - Register Function
router.post("/register", function (req, res) {
  // Capture the input fields
  let username = req.body.username;
  let password = req.body.password;
  // Ensure the input fields exists and are not empty
  if (username && password) {
    connection.query(
      "SELECT username FROM accounts WHERE username = ?",
      [username],
      function (error, result, fields) {
        if (result.length === 0) {
          var sql = "INSERT INTO accounts (username, password) VALUES (?)";
          const passwordHash = bcrypt.hashSync(password, 10);

          var values = [username, passwordHash];
          var new_query = sql + values;
          connection.query(sql, [values], function (error, result) {
            if (error) console.log(error);
          });
          return res.redirect("/");
        } else {
          res.send("User already exists!");
        }
      }
    );
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

router.get("/pricing", (req, res) => {
  res.render("pricing", {
    user: req.session.username,
  });
});
router.get("/features", (req, res) => {
  res.render("features", {
    user: req.session.username,
  });
});
router.get("/support", (req, res) => {
  res.render("support", {
    user: req.session.username,
  });
});

//Auth/ session redirect - Main App
router.get("/app", (req, res) => {
  if (!req.session.username) {
    res.redirect("/login");
  } else {
    connection.query(
      "SELECT * FROM accounts WHERE username = ?",
      [req.session.username],
      function (error, result, fields) {
        planType = result[0].plan;
        if (planType === "free") {
          connection.query(
            "SELECT * FROM steam_accounts_free WHERE username = ?",
            [req.session.username],
            function (error, result, fields) {
              if (result.length === 0) {
                let steamUsername = "None";
                let timeLeft = "0";
                let statusFree = "Inactive";
                if (req.session.loggedin) {
                  // Output username
                  res.render("app", {
                    user: req.session.username,
                    steamUser: steamUsername,
                    timeLeft: timeLeft,
                    statusFree: statusFree,
                  });
                } else {
                  // Not logged in
                  res.send("Please login to view this page!");
                }
                res.end();
              } else {
                let steamUsername = result[0].steam_username;
                let timeLeft = result[0].time_left;
                let statusFree = result[0].status;
                if (req.session.loggedin) {
                  // Output username
                  res.render("app", {
                    user: req.session.username,
                    steamUser: steamUsername,
                    timeLeft: timeLeft,
                    statusFree: statusFree,
                  });
                } else {
                  // Not logged in
                  res.send("Please login to view this page!");
                }
                res.end();
              }
            }
          );
        } else {
          connection.query(
            "SELECT * FROM steam_accounts_free WHERE username = ?",
            [req.session.username],
            function (error, result, fields) {
              if (result.length === 0) {
                let steamUsername = "None";
                let timeLeft = "0";
                let statusFree = "Inactive";
                connection.query(
                  "SELECT * FROM steam_accounts_premium WHERE username = ?",
                  [req.session.username],
                  function (error, result, fields) {
                    if (result.length === 0) {
                      let steamUsername_premium = "None";
                      let timeLeft_premium = "0";
                      let statusPremium = "Inactive";
                      if (req.session.loggedin) {
                        // Output username
                        res.render("app", {
                          user: req.session.username,
                          steamUser: steamUsername,
                          timeLeft: timeLeft,
                          statusFree: statusFree,
                          steamUser_premium: steamUsername_premium,
                          timeLeft_premium: timeLeft_premium,
                          statusPremium: statusPremium,
                        });
                      } else {
                        // Not logged in
                        res.send("Please login to view this page!");
                      }
                      res.end();
                    } else {
                      let steamUsername_premium = result[0].steam_username;
                      let timeLeft_premium = result[0].time_left;
                      let statusPremium = result[0].status;
                      if (req.session.loggedin) {
                        // Output username
                        res.render("app", {
                          user: req.session.username,
                          steamUser: steamUsername,
                          timeLeft: timeLeft,
                          statusFree: statusFree,
                          steamUser_premium: steamUsername_premium,
                          timeLeft_premium: timeLeft_premium,
                          statusPremium: statusPremium,
                        });
                      } else {
                        // Not logged in
                        res.send("Please login to view this page!");
                      }
                      res.end();
                    }
                  }
                );
              } else {
                let steamUsername = result[0].steam_username;
                let timeLeft = result[0].time_left;
                let statusFree = result[0].status;
                connection.query(
                  "SELECT * FROM steam_accounts_premium WHERE username = ?",
                  [req.session.username],
                  function (error, result, fields) {
                    if (result.length === 0) {
                      let steamUsername_premium = "None";
                      let timeLeft_premium = "0";
                      let statusPremium = "Inactive";
                      if (req.session.loggedin) {
                        // Output username
                        res.render("app", {
                          user: req.session.username,
                          steamUser: steamUsername,
                          timeLeft: timeLeft,
                          statusFree: statusFree,
                          steamUser_premium: steamUsername_premium,
                          timeLeft_premium: timeLeft_premium,
                          statusPremium: statusPremium,
                        });
                      } else {
                        // Not logged in
                        res.send("Please login to view this page!");
                      }
                      res.end();
                    } else {
                      let steamUsername_premium = result[0].steam_username;
                      let timeLeft_premium = result[0].time_left;
                      let statusPremium = result[0].status;
                      if (req.session.loggedin) {
                        // Output username
                        res.render("app", {
                          user: req.session.username,
                          steamUser: steamUsername,
                          timeLeft: timeLeft,
                          statusFree: statusFree,
                          steamUser_premium: steamUsername_premium,
                          timeLeft_premium: timeLeft_premium,
                          statusPremium: statusPremium,
                        });
                      } else {
                        // Not logged in
                        res.send("Please login to view this page!");
                      }
                      res.end();
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }
  
});

router.post("/app/account", (req, res) => {
  let steamUsername = req.body.SteamUsername;
  let steamPassword = req.body.SteamPassword;
  // Ensure the input fields exists and are not empty
  if (steamUsername && steamPassword) {
    var sql =
      "INSERT INTO steam_accounts_free (username, steam_username, steam_password) VALUES (?)";

    var encryptedSteamPassword = encrypt(steamPassword);

    var values = [req.session.username, steamUsername, encryptedSteamPassword];
    var new_query = sql + values;
    connection.query(sql, [values], function (error, result) {
      if (error) console.log(error);
      return res.redirect("back");
    });
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});
router.post("/app/premium_account", (req, res) => {
  let steamUsername = req.body.SteamUsername;
  let steamPassword = req.body.SteamPassword;
  // Ensure the input fields exists and are not empty
  if (steamUsername && steamPassword) {
    var sql =
      "INSERT INTO steam_accounts_premium (username, steam_username, steam_password, plan) VALUES (?)";

    var encryptedSteamPassword = encrypt(steamPassword);

    var values = [
      req.session.username,
      steamUsername,
      encryptedSteamPassword,
      "premium",
    ];
    var new_query = sql + values;
    connection.query(sql, [values], function (error, result) {
      if (error) console.log(error);
      return res.redirect("back");
    });
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

let accounts = {};
let title = "MyHourBoost.com - Free idling :)";

function loginAccount(accountName, password, twoFactorCode) {
  if (accounts[accountName]) {
    process.on("uncaughtException", function (Error) {
      console.log(`[!] ${accountName} is already running!`);
    });
  }
  let user = new SteamUser();
  accounts[accountName] = user;
  user.logOn({
    accountName,
    password,
    twoFactorCode,
  });

  process.on("uncaughtException", function (InvalidPassword) {
    console.log("[!] Invalid Password!");
    accounts[accountName].logOff();
    accounts[accountName] = null;
  });
  process.on("uncaughtException", function (RateLimitExceeded) {
    console.log("[!] Rate limit exceeded. Try later!");
  });
  user.on("loggedOn", async () => {
    await user.setPersona(SteamUser.EPersonaState.Online);
    await user.gamesPlayed(title);
    console.log(`\n[!] Logged succesfully as ${accountName}.`);
  });
}

function logoutAccount(accountName) {
  if (!accounts[accountName]) {
    process.on("uncaughtException", function (Error) {
      console.log(`[!] ${accountName} is not running!`);
    });
  }
  if (RateLimitExceeded) {
    process.on("uncaughtException", function (Error) {
      console.log("[!] Rate limit exceeded. Try later!");
    });
  }
  accounts[accountName].logOff();
  accounts[accountName] = null;
  console.log(`[!] Logged off succesfully from ${accountName}.`);
}

router.post("/app/start_free", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_free WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      process.on("uncaughtException", function (error) {
        console.log(`[!] Error - ${error}`);
        res.redirect("back");
      });
      if (result.length === 0) {
        console.log("[!] No steam account added!");
        return res.redirect("back");
      } else {
        connection.query(
          'UPDATE steam_accounts_free SET status="Starting..." WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        let steamUsername = result[0].steam_username;
        let steamPassword = decrypt(result[0].steam_password);
        let steamguard = req.body.SteamGuard;
        loginAccount(steamUsername, steamPassword, steamguard);
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/stop_free", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_free WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      if (error) {
        console.log(error);
        return res.redirect("back");
      }
      if (result.length === 0) {
        console.log("[!] No steam account added!");
        return res.redirect("back");
      } else {
        let steamUsername = result[0].steam_username;
        logoutAccount(steamUsername);
        connection.query(
          'UPDATE steam_accounts_free SET status="Inactive" WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/steamguard", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_free WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      if (error) {
        console.log(error);
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
          twoFactorCode: steamguard,
        });
        process.on("uncaughtException", function (InvalidPassword) {
          console.log("[!] Invalid Password!");
        });
        process.on("uncaughtException", function (RateLimitExceeded) {
          console.log("[!] Rate limit exceeded. Try later!");
        });
        connection.query(
          'UPDATE steam_accounts_free SET status="Started" WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/reset_free", (req, res) => {
  connection.query(
    'UPDATE steam_accounts_free SET status="Inactive" WHERE username = ?',
    [req.session.username],
    function (error, result, fields) {}
  );
  return res.redirect("back");
});
router.post("/app/remove_account_free", (req, res) => {
  connection.query(
    "DELETE FROM steam_accounts_free WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {}
  );
  return res.redirect("back");
});

router.post("/app/start_premium", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_premium WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      process.on("uncaughtException", function (error) {
        console.log(`[!] Error - ${error}`);
        res.redirect("back");
      });
      if (result.length === 0) {
        console.log("[!] No steam account added!");
        return res.redirect("back");
      } else {
        connection.query(
          'UPDATE steam_accounts_premium SET status="Starting..." WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        let steamUsername = result[0].steam_username;
        let steamPassword = decrypt(result[0].steam_password);
        let steamguard = req.body.SteamGuard;
        loginAccount(steamUsername, steamPassword, steamguard);
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/stop_premium", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_premium WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      if (error) {
        console.log(error);
        return res.redirect("back");
      }
      if (result.length === 0) {
        console.log("[!] No steam account added!");
        return res.redirect("back");
      } else {
        let steamUsername = result[0].steam_username;
        logoutAccount(steamUsername);
        connection.query(
          'UPDATE steam_accounts_premium SET status="Inactive" WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/steamguard_premium", (req, res) => {
  connection.query(
    "SELECT * FROM steam_accounts_premium WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {
      process.on("uncaughtException", function (error) {
        console.log(`[!] Error - ${error}`);
        res.redirect("back");
      });
      if (result.length === 0) {
        console.log("[!] No steam account added!");
        return res.redirect("back");
      } else {
        connection.query(
          'UPDATE steam_accounts_premium SET status="Started" WHERE username = ?',
          [req.session.username],
          function (error, result, fields) {}
        );
        let steamUsername = result[0].steam_username;
        let steamPassword = decrypt(result[0].steam_password);
        let steamguard = req.body.SteamGuard;
        loginAccount(steamUsername, steamPassword, steamguard);
        return res.redirect("back");
      }
    }
  );
});
router.post("/app/reset_premium", (req, res) => {
  connection.query(
    'UPDATE steam_accounts_premium SET status="Inactive" WHERE username = ?',
    [req.session.username],
    function (error, result, fields) {}
  );
  return res.redirect("back");
});
router.post("/app/remove_account_premium", (req, res) => {
  connection.query(
    "DELETE FROM steam_accounts_premium WHERE username = ?",
    [req.session.username],
    function (error, result, fields) {}
  );
  return res.redirect("back");
});


router.get("/404", (req, res) => {
  res.render("404");
});
router.get('*', (req, res) => {
  res.redirect('/404');
});


module.exports = router;
