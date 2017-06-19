window.px = window.parent.px;
window.contApp = new (function(){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var status = pj.status();

	/**
	 * initialize
	 */
	function init(){
		var px2dtLDA_pj = px.px2dtLDA.project(pj.projectId);

		px.utils.iterateFnc([
			function(it, arg){
				$('.tpl_name').text( pj.get('name') );
				$('address.center').text( px.packageJson.pickles2.credit );
				it.next(arg);
			} ,
			function(it, arg){
				var $mainTaskUi = $('.cont_maintask_ui');

				var isPathEmptyDir = (function(isDir, path){
					if(!isDir){return false;}
					var ls = px.fs.readdirSync(path);
					// console.log(ls);
					// console.log(ls.length);
					var rtn = !ls.length;
					// console.log(rtn);
					return rtn;
				})(status.pathExists, pj.get('path'));


				if( !status.pathExists
					|| ( status.pathContainsFileCount && !status.entryScriptExists )
					|| ( status.pathExists && !status.composerJsonExists && !isPathEmptyDir )
					|| ( status.pathExists && !status.composerJsonExists )
					|| ( status.pathExists && !status.vendorDirExists )
					|| ( !status.isPxStandby || !status.pathExists || !status.confFileExists )
				){
					// 準備ができていない
					$mainTaskUi
						.html( $('#template-not-ready').html() )
					;
				}else{
					// ちゃんとインストールできてます
					$mainTaskUi
						.html( $('#template-standby').html() )
					;
				}

				var errors = pj.getErrors();
				if( errors.length ){
					var $errors = $('<div class="selectable">');
					for( var idx in errors ){
						$errors.append( $('<pre>').append( $('<code>').text( errors[idx].message ) ) );
					}
					$mainTaskUi.append( $errors );
				}

				it.next(arg);
				return;
			}
		]).start({});

	}// init()


	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})();
