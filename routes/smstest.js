var sms = require('./smsmodule.js');
// 手机号码，格式(区号+手机号码)，例如：8615800000000，其中86为中国的区号
var phoneNum = '+6598539099';
var randCode = Math.floor(1000 + Math.random() * 9000);
var msg = '【秀】您的验证码是' + randCode +'。如非本人操作，请忽略。';
//console.log('【秀】您的验证码是%s', val); // The tree contains 4 monkeys
console.log(msg);
sms.sendsms(phoneNum,msg,function (data) {
    console.log(data.toString());
});
