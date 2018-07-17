const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');
const passport = require('passport');
const router = express.Router();
const session = require('express-session');
const smsExpireAfter = 30000;

require('../passport')(passport);

var sms = require('./smsmodule.js');
var randCode = Math.floor(1000 + Math.random() * 9000);
var msg = '【秀】您的验证码是' + randCode + '。如非本人操作，请忽略。will expire in 30 sec';
var sess = session({ cookie: 30 * 100 });
sess.user = '';

//2FA验证。检查session是否有数据并且没
router.post('/2fa', (req, res) => {
  console.log('2fa verification. session expire:');
  var timeNow = Date.now();
  console.log(timeNow);
  console.log(sess.timestamp);
  if (!sess.user || !sess.timestamp || timeNow > sess.timestamp) {
    return res.json({ success: false, message: '认证码过期!' });
  } else {
    console.log('user in the session:::' + sess.user);
    //save the user into the database 保存用户账号 
    sess.user.save((err) => {
      if (err) {
        console.log("err:::" + err.message);
        return res.json({ success: false, message: 'database write failure:)' });
      }
      res.json({ success: true, message: 'sms认证成功。用户成功加入数据库!' });
    });
  }
});

//test code. to verify sms sending module
//sms.sendsms('6590000000',msg,function(data){});

// 注册账户
router.post('/signup', (req, res) => {
  //use the original field. just assign the phone# to it
  var phone = req.body.phone;
  var countryCode = '65';
  var phoneNum = countryCode + phone;
  if (!req.body.phone || !req.body.password) {
    res.json({ success: false, message: '请输入您的电话号码和密码.' });
  } else {
    var newUser = new User({
      countryCode: countryCode,
      phone: phone,
      password: req.body.password,
      token: token
    });
    var token = jwt.sign({ phone: newUser.phone }, config.secret, {});
    newUser.token = 'Bearer ' + token;
    //send 4 digits code to the phone#
    //sms.sendsms(phoneNum,msg,function(data){});

    sess.timestamp = Date.now() + 30000;
    sess.user = newUser;
    //sess.token = token;
    res.json({ success: true, message: '4 digits code sent!', token: 'Bearer ' + token });
    //保存用户账号to the session not in the db 
    /*newUser.save((err) => {
      if (err) {
        //for debug purpose 
        return res.json({success: true, message: '4 digits code sent!(for test only)', token:'Bearer ' + token});
        //return res.json({success: false, message: '注册失败!'});
      }      
      res.json({success: true, message: '4 digits code sent!', token:'Bearer ' + token});
    });*/
  }
});

// 检查用户名与密码并生成一个accesstoken如果验证通过
router.post('/user/accesstoken', (req, res) => {
  var phone = req.body.phone;
  User.findOne({
    phone: phone
  }, (err, user) => {
    if (err) {
      throw err;
    }
    if (!user) {
      res.json({ success: false, message: '认证失败,用户不存在!' });
    } else if (user) {
      // 检查密码是否正确
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          var token = jwt.sign({ phone: user.phone }, config.secret, {
            expiresIn: 10080
          });
          user.token = 'Bearer ' + token;
          user.save(function (err) {
            if (err) {
              res.send(err);
            }
          });
          res.json({
            success: true,
            message: '验证成功!',
            token: 'Bearer ' + token,
          });
        } else {
          res.send({ success: false, message: '认证失败,密码错误!' });
        }
      });
    }
  });
});

// passport-http-bearer token 中间件验证
// 通过 header 发送 Authorization -> Bearer  + token
// 或者通过 ?access_token = token
/*
router.get('/user/user_info',
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    res.json({username: req.user.name});
});
*/
router.post('/user/user_info', (req, res) => {
  User.findOne({
    phone: req.body.phone
  }, (err, user) => {
    if (err) {
      throw err;
    }
    //console.log(user);
    if (!user) {
      res.json({ success: false, message: '用户不存在!' });
    } else if (user) {
      // 检查token是否正确
      if (user.token == req.body.token) {
        //clear token in db
        return res.json({phone: req.body.phone});
      } else {
        res.send({ success: false, message: '认证失败,token错误!' });
      }
    }
  });
});

router.post('/user/logout', (req, res) => {
  var token = req.body.token;
  var phone = req.body.phone;
  User.findOne({
    phone: phone
  }, (err, user) => {
    if (err) {
      throw err;
    }
    console.log(user);
    if (!user) {
      res.json({ success: false, message: '用户不存在!' });
    } else if (user) {
      // 检查token是否正确
      if (user.token == req.body.token) {
        //clear token in db
        user.token = '';
        user.save(function (err) {
          if (err) {
            res.send(err);
          }
        });
        res.json({
          success: true,
          message: 'logout successful!'
        });
        res.redirect('/user/acesstoken')
      } else {
        res.send({ success: false, message: '认证失败,token错误!' });
      }
    }
  });
});

function isLoggedIn(req, res, next) {
  if (req.isLoggedIn()) {
    next();
  } else {
    res.redirect('/acesstoken')
  }
}

//logout
/*router.get('/user/logout',
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    res.json({username: req.user.name});
});

function isLoggedIn(req,res,next){
  if(req.isLoggedIn()){
    next();
  } else{
    res.redirect('/acesstoken')
  }
}*/


module.exports = router;
