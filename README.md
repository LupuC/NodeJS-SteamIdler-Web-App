# MyHourBoost

MyHourBoost is an application to boost your hours on steam library.

This was made using:
1. NodeJS
2. EJS
3. ExpressJS
4. HTML + CSS
5. Xampp (For MySQL database)

To connect to steam api, I used [steam-user](https://github.com/DoctorMcKay/node-steam-user) by [@DoctorMcKay](https://github.com/DoctorMcKay).

## How to use?
Download or clone the repository

Run npm install

Run npm start to start the server

For database, I used mysql with following tables:

1. accounts - for website accounts
2. steam_accounts_free - for steam accounts but for free plan
3. steam_accounts_premium - for steam accounts but for premium plan (multiple accounts)
4. beta_keys - beta keys to register
5. beta_keys_used - beta keys used by users

When you register to website, the password will be encrypted, and also the steam accounts will be encrypted too.

# Updates/ to do
1. Add support page [ ]
2. Optimize the code (make it lightweight) [ ]
3. Add google login support [ ]

# Roadmap
```
app.js (main app function)
    |
    |- Routers
         |- index.ejs (pages render & functions)
    |
    |- Views
         |- .ejs (html pages)
    |
    |- Public
         |- Images, Css, Js & Assets

```

# Showcase
You can find an video [here](https://www.youtube.com/watch?v=sDBT-DZDIy4)



Main Page
![Main Page](showcase/1.png)

Features page
![Features Page](showcase/2.png)

Pricing Page
![Pricing Page](showcase/3.png)

Free user Page
![Free user Page](showcase/4.png)

Premium user Page
![Premium user Page](showcase/5.png)

Database
![Database](showcase/Screenshot_1.png)


If you have any question, don't hesitate to contact me at lupucl.com or via email here: contact@lupucl.com
