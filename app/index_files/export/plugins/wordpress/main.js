/**
 * export/plugins/wordpress/main.js
 */
module.exports = function(){
}
/**
 * Wordpressに出力する
 */
module.exports.execute = function(systemName, option, callback){
	callback = callback || function(){};
	setTimeout(function(){
		callback(true);
	}, 1000);
	return;

}
