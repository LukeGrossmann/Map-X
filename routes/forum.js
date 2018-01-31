"use strict";

const express = require('express');
const router  = express.Router();

const ENV         = process.env.ENV || "development";
const knexConfig  = require("../knexfile");
const knex        = require("knex")(knexConfig[ENV]);
var knexLogger = require('knex-logger');
router.use(knexLogger(knex));


router.get('/', (req, res) => {
  knex('topics')
    .leftJoin('users', 'users.id', '=', 'topics.users_id')
    .select('topics.id', 'topics.title', 'topics.created_at', 'users.username', 'topics.rating', 'topics.description')
    .then(topics => {
      console.log('topics');
      res.render("show_forum.ejs", {topics});
  });
});

router.post('/', (req, res) => {
  if (!req.body.text) {
    console.log('ReqBody', req.body)
    res.status(400).send({ error: 'invalid request: no data in POST body'});
    return;
  }

  knex('topics').insert({title: req.body.text, description: req.body.description}).then(function() {
    res.redirect('/forum');
  });
});

router.get('/topics/:id', (req, res) => {
  let topicId = Number(req.params.id);

  knex('topics as t')
    .rightJoin('comments as c', 'c.topics_id', '=', 't.id')
    .join('users as usertopic', 'usertopic.id', '=', 't.users_id')
    .leftJoin('users as usercomments', 'usercomments.id', '=', 'c.users_id')
    .select('c.description', 'c.topics_id', 't.id as topicid', 't.title', 'c.created_at', 'usertopic.username', 't.description as topicdes', 'usercomments.username as cUsername', 'c.rating', 't.created_at', 'c.id as commentid')
    .where('t.id', '=', topicId)
    .then(comments => {
      console.log(comments);
      const firstComment = comments[0];
      let topicTitle = firstComment && firstComment.title;
      let usernameTopic = firstComment && firstComment.username;
      let topicDescription = firstComment && firstComment.topicdes;
      let topictime = firstComment && firstComment.created_at;
      if (firstComment == null || firstComment.description === null) {
        comments = [];
      }
      res.render("show_forum_topic.ejs", {comments, topicId, topicTitle, usernameTopic, topicDescription, topictime});
    });
});

router.post('/topics/:id', (req, res) => {
  let topicId = req.params.id;

  if (!req.body.comment_text) {
    console.log('ReqBody', req.body)
    res.status(400).send({ error: 'invalid request: no data in POST body'});
    return;
  }

  knex('comments').insert({description: req.body.comment_text, topics_id: topicId}).then(function() {
    res.redirect('/forum/topics/'+ topicId);
  });
});

router.post('/topics/:id/likes', (req, res) => {
  let topicId = req.params.id;
  let likenum = req.body.likes;
  knex('topics')
    .update({rating: likenum})
    .where('topics.id', '=', topicId)
    .then(function() {
      res.redirect('/forum/topics/'+ topicId);
  });

});

router.post('/topics/:id/comments/:commentid/likes', (req, res) => {
  let topicId = req.params.id;
  let commentId = req.params.commentid;
  let likenum = req.body.likes;


  knex('comments')
    .update({rating: likenum})
    .where('comments.topics_id', '=', topicId)
    .where('comments.id', '=', commentId)
    .then(function() {
      res.redirect('/forum/topics/'+ topicId);
  });


});


module.exports = router;