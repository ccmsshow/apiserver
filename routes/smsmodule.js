var http = require('http');

// 修改为您的短信账号
var account="I4624313";
// 修改为您的短信密码
var password="ZEfImJoa3P0f82";
// 修改为您要发送的短信内容
var msg="【秀】您的验证码是123456。如非本人操作，请忽略。";
// var msg="test";
// 短信域名地址
var sms_host = 'intapi.253.com';
// 发送短信地址
var send_sms_uri = '/send/json';

exports.sendsms = function(mobile,message,callback){
    return send_sms(send_sms_uri,account,password,mobile,message,callback);
}

//send_sms(send_sms_uri,account,password,mobile,msg);

// 发送短信方法
function send_sms(uri,account,password,mobile,msg,callback){
	
    var post_data = { // 这是需要提交的数据 
    'account': account,   
    'password': password, 
    'mobile':mobile,
    'msg':msg,
    };  
    var content =  JSON.stringify(post_data);  
    post(uri,content,sms_host,callback);
	
}
  
function post(uri,content,host,callback){
	var options = {  
        hostname: host,
        port: 80,  
        path: uri,  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/json; charset=UTF-8', 
        }  
    };
    var req = http.request(options, function (res) {  
        console.log('STATUS: ' + res.statusCode);  
        
        res.setEncoding('utf8');  
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);  
            callback("['status':" + res.statusCode + ", 'body':"  + chunk + "]");
        });  
    }); 
   
    req.write(content);  
  
    req.end();   
} 
