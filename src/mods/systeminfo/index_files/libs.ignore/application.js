/**
 * application.js
 */
module.exports = function(px){
	var _this = this;

	this.getInfo = function(callback){
		callback = callback || function(){};
		var systemInfo = [];

		px.it79.fnc({}, [
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Pickles 2 Application Version
				systemInfo.push({'label': 'Pickles 2 Application Version', 'value': px.getVersion()});
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Platform
				systemInfo.push({'label': 'Platform', 'value': px.process.platform + ' - ' + px.getPlatform()});
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Current directory
				systemInfo.push({'label': 'Current directory', 'value': px.process.cwd()});
				it1.next();

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: node version
				systemInfo.push({'label': 'node(inside nw) version', 'value': px.process.versions.node});
				systemInfo.push({'label': 'nw version', 'value': px.process.versions.nw});
				systemInfo.push({'label': 'openssl version', 'value': px.process.versions.openssl});
				it1.next();

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: Preview URL
				systemInfo.push({'label': 'Preview URL', 'value': px.preview.getUrl()});
				it1.next();

			},
			function(it1, arg){
				callback(systemInfo);
			}
		]);

		return;
	}

	return;
}
