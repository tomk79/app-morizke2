/**
 * export/export.js
 */
module.exports = function(px){
	var plugins = {};
	plugins.wordpress = require('./plugins/wordpress/main.js');

	/**
	 * 出力を実行する
	 */
	this.execute = function(systemName, option, callback){
		callback = callback || function(){};
		if( !plugins[systemName] ){
			callback(false);
			return;
		}
		plugins[systemName].execute(systemName, option, function(result){
			callback(result);
		});
		return;

	}
}
