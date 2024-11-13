const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Article Model
let Article = require('../models/article');
// User Model
let User = require('../models/user');

// Add Route
router.get('/add', ensureAuthenticated, function(req, res){
  res.render('add_article', {
    title:'Add Article'
  });
});

// Add Submit POST Route
router.post('/add', [
  // Validierung
  check('title', 'Title is required').notEmpty(),
  check('body', 'Body is required').notEmpty()
], async function(req, res){
  // Get Errors
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    res.render('add_article', {
      title:'Add Article',
      errors: errors.array()
    });
  } else {
    try {
      let article = new Article({
        title: req.body.title,
        author: req.user._id,
        author_name: req.user.name,
        body: req.body.body
      });

      await article.save();
      req.flash('success','Article Added');
      res.redirect('/');
    } catch(err) {
      console.log(err);
      req.flash('error', 'Error saving article');
      res.redirect('/articles/add');
    }
  }
});

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, async function(req, res){
  try {
    const article = await Article.findById(req.params.id);
    if(article.author != req.user._id){
      req.flash('danger', 'Not Authorized');
      res.redirect('/');
    } else {
      res.render('edit_article', {
        title:'Edit Article',
        article:article
      });
    }
  } catch(err) {
    console.log(err);
    res.redirect('/');
  }
});

// Update Submit POST Route
router.post('/edit/:id', async function(req, res){
  try {
    const article = {
      title: req.body.title,
      author: req.user._id,
      body: req.body.body
    };

    const query = {_id:req.params.id};
    await Article.updateOne(query, article);
    req.flash('success', 'Article Updated');
    res.redirect('/');
  } catch(err) {
    console.log(err);
    return;
  }
});

// Delete Article
router.delete('/:id', async function(req, res){
  if(!req.user._id){
    res.status(500).send();
    return;
  }

  try {
    const article = await Article.findById(req.params.id);
    if(article.author != req.user._id){
      res.status(500).send();
      return;
    }

    await Article.deleteOne({_id: req.params.id});
    res.send('Success');
  } catch(err) {
    console.log(err);
    res.status(500).send();
  }
});

// Get Single Article
router.get('/:id', async function(req, res){
  try {
    const article = await Article.findById(req.params.id);
    const user = await User.findById(article.author);
    res.render('article', {
      article: article,
      author: user.name
    });
  } catch(err) {
    console.log(err);
    res.redirect('/');
  }
});

// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}

module.exports = router;
