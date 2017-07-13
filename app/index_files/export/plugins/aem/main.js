/**
 * export/plugins/aem/main.js
 */
module.exports = function(){
}
/**
 * AEMに出力する
 */
module.exports.execute = function(px, systemName, option, callback){
	callback = callback || function(){};
	setTimeout(function(){
		callback(true);
	}, 4000);
	return;

}
