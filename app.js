// app.js
require('dotenv').config(); // Stelle sicher, dass dies ganz oben steht

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

// Mongoose Verbindung mit Umgebungsvariable
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 100
}).then(() => {
  console.log('Mit MongoDB verbunden');
}).catch(err => {
  console.log('MongoDB-Verbindungsfehler:', err);
});

// Init App
const app = express();

// Bring in Models
let Article = require('./models/article');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// Passport Config & Middleware
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Express Messages Middleware
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Globale User Variable
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Home Route mit async/await
app.get('/', async (req, res) => {
  try {
    const articles = await Article.find({});
    res.render('index', {
      title: 'Artikel',
      articles: articles
    });
  } catch(err) {
    console.log(err);
    res.status(500).send('Serverfehler');
  }
});

// Route Files
const articlesRoute = require('./routes/articles');
const usersRoute = require('./routes/users');
app.use('/articles', articlesRoute);
app.use('/users', usersRoute);

// Error Handler (sollte am Ende nach allen anderen Routen sein)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Etwas ist schief gelaufen!');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server gestartet auf Port ${PORT}...`);
});
