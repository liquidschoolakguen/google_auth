// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = function(passport) {

  // Lokale Strategie
  passport.use(new LocalStrategy(
    async function(username, password, done) {
      try {
        // Suche nach dem Benutzer
        const user = await User.findOne({ username: username });

        if (!user) {
          return done(null, false, { message: 'Falscher Benutzername' });
        }

        // Passwort vergleichen, nur wenn Passwort vorhanden ist
        if (!user.password) {
          return done(null, false, { message: 'Passwort nicht gesetzt. Bitte melde dich über Google an.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Falsches Passwort' });
        }

      } catch (err) {
        return done(err);
      }
    }
  ));

  // Google Strategie
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL
    },
    async function(accessToken, refreshToken, profile, done) {
      try {
        // Suche nach dem Benutzer anhand der Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Benutzer existiert bereits
          return done(null, user);
        } else {
          // Suche nach Benutzer anhand der E-Mail, falls vorhanden
          const existingUser = await User.findOne({ email: profile.emails[0].value });

          if (existingUser) {
            // Verbinde Google ID mit bestehendem Benutzer
            existingUser.googleId = profile.id;
            existingUser.avatar = profile.photos[0].value;
            await existingUser.save();
            return done(null, existingUser);
          } else {
            // Neuen Benutzer erstellen
            const newUser = new User({
              name: profile.displayName,
              username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
              googleId: profile.id,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value
            });

            await newUser.save();
            return done(null, newUser);
          }
        }
      } catch (err) {
        return done(err, false);
      }
    }
  ));

  // Benutzer serialisieren
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Benutzer deserialisieren
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch(err) {
      done(err);
    }
  });
};
