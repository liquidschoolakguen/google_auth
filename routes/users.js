// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', function(req, res){
  res.render('register');
});

// Register Process
router.post('/register', [
  check('name', 'Name ist erforderlich').notEmpty(),
  check('email', 'Email ist erforderlich').notEmpty(),
  check('email', 'Email ist nicht gültig').isEmail(),
  check('username', 'Username ist erforderlich').notEmpty(),
  check('password', 'Passwort ist erforderlich').notEmpty(),
  check('password2', 'Passwörter stimmen nicht überein').custom((value, {req}) => value === req.body.password)
], async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('register', {
        errors: errors.array()
      });
      return;
    }

    const { name, email, username, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'Email oder Username existiert bereits');
      return res.redirect('/users/register');
    }

    const newUser = new User({
      name,
      email,
      username,
      password
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    newUser.password = hash;

    await newUser.save();

    req.flash('success','Sie sind jetzt registriert und können sich einloggen');
    res.redirect('/users/login');

  } catch (err) {
    console.log(err);
    req.flash('error', 'Bei der Registrierung ist ein Fehler aufgetreten');
    res.redirect('/users/register');
  }
});

// Login Form
router.get('/login', function(req, res){
  res.render('login');
});

// Login Process
router.post('/login', function(req, res, next){
  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req, res, next);
});

// Google Authentication
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Callbackn ff
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/users/login', failureFlash: true }),
  (req, res) => {
    // Erfolgreiche Authentifizierung, weiterleiten zur Startseite oder einem Dashboard
    res.redirect('/');
  }
);

// Logout
router.get('/logout', function(req, res, next){
  console.log('Logout gestartet');

  if (req.isAuthenticated()) {
    req.logout(function(err) {
      if (err) {
        console.log('Logout Fehler:', err);
        return next(err);
      }
      console.log('Logout abgeschlossen');
      req.flash('success', 'Sie sind abgemeldet');
      res.redirect('/users/login');
    });
  } else {
    console.log('Logout: Benutzer war nicht authentifiziert');
    req.flash('success', 'Sie sind abgemeldet');
    res.redirect('/users/login');
  }
});

module.exports = router;
