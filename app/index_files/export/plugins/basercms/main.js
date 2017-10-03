/**
 * export/plugins/basercms/main.js
 */
module.exports = function(){
}
/**
 * baserCMSに出力する
 */
module.exports.execute = function(px, systemName, options, callback){
	callback = callback || function(){};

	function pad(str, len){
		str += '';
		str = phpjs.str_pad(str, len, '0', 'STR_PAD_LEFT');
		return str;
	}
	function getTimeString(){
		var date = new Date();
		var rtn = '';
		rtn += pad(date.getFullYear(),4)+pad(date.getMonth()+1, 2)+pad(date.getDate(), 2);
		rtn += '-'+pad(date.getHours(),2)+pad(date.getMinutes(), 2);
		return rtn;
	}

	var nodePhpBin = px.nodePhpBin;
	var utils79 = px.utils79;
	var pj = px.getCurrentProject();
	var path_mz2_baserCms = require('path').resolve(__dirname+'/../../../../common/php/mz2-baser-cms/execute.php');
	var entryScript = require('path').resolve(pj.get('path'), pj.get('entry_script'));

	if( !options.path_output_dir || !utils79.is_dir(options.path_output_dir) ){
		callback(false, 'output directory is NOT exists.');
		return;
	}

	var param = {
		'entryScript': entryScript,
		'path_output_zip': options.path_output_dir+'/mz2-export-'+getTimeString()+'.zip',
		'options':{
			'local_resource_mode': options.local_resource_mode
		}
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
