/**
 * px.project.searcher
 */
module.exports = function( px, pj ) {
	// global.__defineGetter__('__LINE__', function () { return (new Error()).stack.split('\n')[2].split(':').reverse()[1]; }); var var_dump = function(val){ console.log(val); };

	var _this = this;
	var it79 = require('iterate79');

	/**
	 * GUI編集されているコンテンツを持つページの一覧を取得
	 */
	this.getGuiEditPages = function(callback){
		console.log('=-=-=-=-=-=-=-=-=-= px.project.searcher.getGuiEditPages()');
		callback = callback || function(){};

		var rtn = [];
		var sitemap = pj.site.getSitemap();

		it79.ary(
			sitemap,
			function(it1, pageInfo, idx){

				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						var procType = pj.get_path_proc_type( pageInfo.path );
						if( procType == 'html' || procType == 'htm' ){
						}else{
							it1.next();
							return;
						}
						rlv();
						return;
					}); })
					.then(function(){ return new Promise(function(rlv, rjt){
						pj.getPageContentEditorMode(pageInfo.path, function(procType){
							if( procType == 'html.gui' ){
							}else{
								it1.next();
								return;
							}
							rlv();
						});
						return;
					}); })
					.then(function(){ return new Promise(function(rlv, rjt){
						rtn[idx] = pageInfo;
						it1.next();
						return;
					}); })
				;
				return;
			},
			function(){
				callback(rtn);
			}
		);
		return;
	}

	return;
};
