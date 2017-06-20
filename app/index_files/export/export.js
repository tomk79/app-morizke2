/**
 * export/export.js
 */
module.exports = function(px){

	/**
	 * 出力を実行する
	 */
	this.execute = function(systemName, option, callback){
		callback = callback || function(){};
		setTimeout(function(){
			callback(true);
		}, 1000);
		return;

	}
}
