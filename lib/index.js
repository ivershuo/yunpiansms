/**
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
*/

var request = require('request'),
	util    = require('util'),
	events  = require('events');

var API_VERSION = 'v1',
	API_URI = 'http://yunpian.com/' + API_VERSION;

function Sms(smsInst){
	this.inst = smsInst;
	this.res  = 'sms';
}
Sms.prototype._sendMulti = function(data, _func){
	var sms = this.inst,
		self = this;
	var total    = data.length,
		preReq   = Math.min(5, total),
		sentOk   = 0,
		sentFail = 0;
	return new Promise(function(resolve, reject){
		function r(){
			if(!data.length){
				return;
			}
			for(var i = 0; i < preReq; i++){
				(function(d){
					var emitData = {mobile : d.mobile, text : d.text || d.tpl_value};
					sms.emit('ready2send', emitData);

					sms.request(self.res, _func, d).then(function(){
						sms.emit('sentOk', emitData);
						sentOk++;
						sms.emit('sentProgress', {progress : (sentOk + sentFail)/ total});
						if(sentOk + sentFail < total){
							return r();
						} else {
							sms.emit('allSent', {ok : sentOk, fail : sentFail});
							resolve();
						}
					}).catch(function(){
						sms.emit('sentFail', emitData);
						sentFail++;
						sms.emit('sentProgress', {progress : (sentOk + sentFail)/ total});
						if(sentOk + sentFail < total){
							return r();
						} else {
							sms.emit('allSent', {ok : sentOk, fail : sentFail});
							resolve();
						}
					});
				})(data.shift());
			}
			preReq = 1;
		}
		r();
	});
};

/**
http://www.yunpian.com/api/sms.html?#send
@param  {[String|Array]} mobile
@param  {[String]} [options] text
@param  {[String]} [options] extend
@param  {[String]} [options] uid
`text` must be given when `mobile` is string.
example:
send('13888888888', 'hello');
send([{mobile : '13888888888', text : 'hello'}, {mobile : '136666666', text : 'hi', extend : '001'}]);

@return {Promise}
*/
Sms.prototype.send = function(mobile, text, extend, uid){
	var data;
	if(util.isArray(mobile)){
		data = mobile;
	} else {
		data = [{
			mobile : mobile,
			text   : text,
			extend : extend,
			uid    : uid
		}];
	}
	return this._sendMulti(data, 'send');
};

/**
http://www.yunpian.com/api/sms.html?#tpl_send
@param  {[String|Array]} mobile
@param  {[String]} [options] tpl_id
@param  {[String]} [options] tpl_value
@param  {[String]} [options] extend
@param  {[String]} [options] uid
`tpl_id` and `tpl_value` must be given when `mobile` is string.
example:
send('13888888888', '1', 'h5%E8%AF%B4');
send([{mobile : '13888888888', tpl_id : '1', 'tpl_value' : '#code#=1234&#company#=h5%E8%AF%B4'}, {...}]);

@return {Promise}
*/
Sms.prototype.tpl_send = function(mobile, tpl_id, tpl_value, extend, uid){
	var data;
	if(util.isArray(mobile)){
		data = mobile;
	} else {
		data = [{
			mobile    : mobile,
			tpl_id    : tpl_id,
			tpl_value : tpl_value,
			extend    : extend,
			uid       : uid
		}];
	}
	data.forEach(function(d){
		var tpl_value = d.tpl_value;
		if(util.isObject(tpl_value)){
			var tplValueStr = [];
			for(var key in tpl_value){
				tplValueStr.push('#' + encodeURIComponent(key) + '#=' + encodeURIComponent(tpl_value[key]));
			}
			d.tpl_value = tplValueStr.join('&');
		}
	});
	return this._sendMulti(data, 'tpl_send');
};

/**
http://www.yunpian.com/api/sms.html?#pull_status
@return {Promise}
*/
Sms.prototype.pull_status = function(page_size){
	return this.inst.request(this.res, 'pull_status', {
		page_size : page_size
	});
};

/**
http://www.yunpian.com/api/sms.html?#pull_reply
@return {Promise}
*/
Sms.prototype.pull_reply = function(page_size){
	return this.inst.request(this.res, 'pull_reply', {
		page_size : page_size
	});
};

/**
http://www.yunpian.com/api/sms.html?#get_black_word
@return {Promise}
*/
Sms.prototype.get_black_word = function(text){
	return this.inst.request(this.res, 'get_black_word', {
		text : text
	});
};

/**
http://www.yunpian.com/api/sms.html?#get_reply
@return {Promise}
*/
Sms.prototype.get_reply = function(data){
	return this.inst.request(this.res, 'get_reply', data);
};

function User(smsInst){
	this.inst = smsInst;
	this.res  = 'user';
}

/**
http://www.yunpian.com/api/user.html#get
@return {Promise}
*/
User.prototype.get = function(){
	return this.inst.request(this.res, 'get');
};

/**
http://www.yunpian.com/api/user.html#set
@return {Promise}
*/
User.prototype.set = function(emergency_contact, emergency_mobile, alarm_balance){
	return this.inst.request(this.res, 'set', {
		emergency_contact : emergency_contact,
		emergency_mobile  : emergency_mobile,
		alarm_balance     : alarm_balance
	});
};

function Tpl(smsInst){
	this.inst = smsInst;
	this.res  = 'tpl';
}

/**
http://www.yunpian.com/api/tpl.html#get_default
@return {Promise}
*/
Tpl.prototype.get_default = function(tpl_id){
	return this.inst.request(this.res, 'get_default', {
		tpl_id : tpl_id
	});
};

/**
http://www.yunpian.com/api/tpl.html#add
@return {Promise}
*/
Tpl.prototype.add = function(tpl_content, notify_type){
	return this.inst.request(this.res, 'add', {
		tpl_content : tpl_content,
		notify_type : notify_type
	});
};

/**
http://www.yunpian.com/api/tpl.html#get
@return {Promise}
*/
Tpl.prototype.get = function(tpl_id){
	return this.inst.request(this.res, 'get', {
		tpl_id : tpl_id
	});
};

/**
http://www.yunpian.com/api/tpl.html#update
@return {Promise}
*/
Tpl.prototype.update = function(tpl_id, tpl_content){
	return this.inst.request(this.res, 'update', {
		tpl_id      : tpl_id,
		tpl_content : tpl_content
	});
};

/**
http://www.yunpian.com/api/tpl.html#del
@return {Promise}
*/
Tpl.prototype.del = function(tpl_id){
	return this.inst.request(this.res, 'del', {
		tpl_id : tpl_id
	});
};

function YunpianSMS(apikey, isDebug){
	if(!(this instanceof YunpianSMS)){
		return new YunpianSMS(apikey, isDebug);
	}
	events.EventEmitter.call(this);
	this.apikey = apikey;

	this.init(isDebug);
}
util.inherits(YunpianSMS, events.EventEmitter);

/**
Request yunpian.com api.
http://www.yunpian.com/api/usage.html
*/
YunpianSMS.prototype.request = function(resource, _function, data){
	var self = this,
		reqUri = API_URI + '/' + resource + '/' + _function + '.json' + '?apikey=' + this.apikey;
	data = data || {};
	data.apikey = self.apikey;

	return new Promise(function(resolve, reject) {
		self.emit('YunpianSMSLog', ['发送请求', reqUri,  data]);
		request.post({
			url  : reqUri,
			form : data
		}, function(err, response, body){
			if(!err && response.statusCode == 200 && body){
				try{
					var data = JSON.parse(body);
					if(data.code === 0){
						resolve(data);
					} else {
						self.emit('err', data);
						reject(data);
					}
				} catch(e){
					var errData = {
						code : -101,
						msg  : '返回数据解析错误',
						detail : body
					};
					self.emit('err', errData);
					reject(data);
				}
			} else {
				var errData = {
					code : -100,
					msg  : '请求网络发生错误',
					detail : body || 'no body data'
				};
				self.emit('err', errData);
				reject(errData);
			}
			self.emit('YunpianSMSLog', ['接受返回', response.statusCode, body, err]);
		});
	});
};

YunpianSMS.prototype.init = function(isDebug){
	if(isDebug){
		var _emit = this.emit;
		this.emit = function(type, data){
			_emit.apply(this, [type, data]);
			console.log.apply(console, ['[' + new Date + ']', type, JSON.stringify(data)]);
		};
	}

	this.sms  = new Sms(this);
	this.user = new User(this);
	this.tpl  = new Tpl(this);
};

/**
Alias for sms.send and sms.tpl_send.
Arguments as sms.send or sms.tpl_send.
If the 2nd argument is set and it ony contains numbers, will call sms.tpl_send.
*/
YunpianSMS.prototype.send = function(mobile, text, tpl_value){
	var method = this.sms.send;
	if(typeof tpl_value !== 'undefined' && /^\d+$/.test(text) || mobile[0].tpl_id){
		method = this.sms.tpl_send;
	}
	return method.apply(this.sms, Array.prototype.slice.apply(arguments));
};

module.exports = YunpianSMS;