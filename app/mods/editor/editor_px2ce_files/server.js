window.contAppPx2CEServer = function(px, page_path, callback){
	callback = callback||function(){};

	var _this = this;
	var data = {};
	var param = {};

	var it79 = require('iterate79');
	var px2ce;
	var _pj;


	it79.fnc(data, [
		function(it1, data){
			param = px.utils.parseUriParam( window.location.href );
			// console.log( param );

			_pj = px.getCurrentProject();

			it1.next(data);
		} ,
		function(it1, data){
			// console.log(data);
			// console.log(param);
			// console.log(_pj.getConfig().plugins.px2dt);

			_pj.createPickles2ContentsEditorServer(
				page_path ,
				function(b){
					px2ce = b;
					console.log('px2ce callbacked.');
					it1.next(data);
				}
			);

		} ,
		function(it1, data){
			callback(px2ce);
			it1.next(data);
		}
	]);


};
