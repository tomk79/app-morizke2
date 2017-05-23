/**
 * px.hint
 */
module.exports = function( px , csv , callback) {
	callback = callback || function(){};
	var _this = this;

	var LangBank = require('langbank');
	this.lb = new LangBank( csv, function(){
		_this.lb.setLang('ja'); // default language
		// console.log(px.lb.get('welcome'));
		callback();
	}); // new LangBank()

	/**
	 * 自然言語をセットする
	 */
	this.setLang = function(lang){
		this.lb.setLang(lang);
		return this;
	}

	/**
	 * ヒントを取得する
	 */
	this.get = function(key){
		return this.lb.get(key);
	}

	/**
	 * ヒントをランダムに1つ取得する
	 */
	this.getRandom = function(){
		var list = this.lb.getList();
		var keys = px._.keys(list);
		var key = px._.shuffle(keys)[0];
		return this.lb.get(key);
	}

	return this;
};
