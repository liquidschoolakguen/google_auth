// models/user.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String
    // Optional, falls der Benutzer sich über Google anmeldet
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
    // Optional, falls der Benutzer sich nur über Google anmeldet
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
