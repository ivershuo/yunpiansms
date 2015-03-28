A Node.js SDK for Yunpian SMS.
---

>npm install yunpiansms

The interface is similar to the [API](http://www.yunpian.com/api/usage.html).

`yunpiansms.{resource}.{function}()`


All functions return a promise(es6-shim).


Example:
```javascript
var sms = new YunpianSMS('apikey');
sms.send('13888888888', 'Hello').then(function(){
	console.log('OK!');
});
sms.tpl.get('1').catch(function(){
	console.log('Tpl Not Found!');
});
```