/**
 * export/plugins/basercms/main.js
 */
module.exports = function(){
}
/**
 * baserCMSに出力する
 */
module.exports.execute = function(px, systemName, option, callback){
	callback = callback || function(){};

	var nodePhpBin = px.nodePhpBin;
	var utils79 = px.utils79;
	var pj = px.getCurrentProject();
	var path_mz2_baserCms = require('path').resolve(__dirname+'/../../../../common/php/mz2-baser-cms/execute.php');
	var entryScript = require('path').resolve(pj.get('path'), pj.get('entry_script'));

	var param = {
		'entryScript': entryScript,
		'path_output_dir': './' // TODO: 仮
	};

	// PHPスクリプトを実行する
	var rtn = '';
	var err = '';
	nodePhpBin.script(
		[
			path_mz2_baserCms,
			utils79.base64_encode(JSON.stringify(param))
		],
		{
			"success": function(data){
				rtn += data;
				// console.log(data);
			} ,
			"error": function(data){
				rtn += data;
				err += data;
				console.log(data);
			} ,
			"complete": function(data, error, code){
				setTimeout(function(){
					try {
						rtn = JSON.parse(rtn);
					} catch (e) {
						console.error('Failed to parse JSON string.');
						console.error(rtn);
						rtn = false;
					}
					console.log(rtn, err, code);
					callback(rtn, err, code);
				},500);
			}
		}
	);

	return;

}
