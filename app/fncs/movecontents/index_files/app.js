window.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }
	var _this = this;
	var _pj = px.getCurrentProject();

	/**
	 * アプリケーションを初期化
	 */
	function init(){

		$('.cont_main_form')
			.submit( function(){
				executeMove( $(this).find('textarea').val() );
				return false;
			} )
		;
	}

	/**
	 * 移動処理を実行
	 */
	function executeMove( targetList ){
		var $body = $('<div>');
		var $btnOk = $('<button>')
			.text('OK')
			.click(function(){
				px.closeDialog();
			})
		;
		px.dialog({
			'title': '移動処理を実行しています...',
			'body': $body.text('時間がかかる場合があります。しばらくそのままでお待ちください。'),
			'buttons': [
				$btnOk.attr({
					'disabled': 'disabled'
				})
			]
		});
		targetList = JSON.parse( JSON.stringify( targetList ) );
		targetList = px.php.trim( targetList );
		var rows = targetList.split(new RegExp('\r\n|\r|\n'));
		var queue = [];
		function normalizePath(path){
			if( path.match(new RegExp('\\/$')) ){
				path += _pj.get_directory_index_primary();
			}
			path = px.path.resolve('/', px.php.trim(path));
			return path;
		}
		for( var idx in rows ){
			rows[idx] = px.php.trim( rows[idx] );
			if( !rows[idx] ){ continue; }
			var tmpRow = rows[idx].split(',');
			queue.push( { 'from': normalizePath(tmpRow[0]), 'to': normalizePath(tmpRow[1]) } );
		}
		if( !queue.length ){
			$body.text('移動の指示がありません。終了します。');
			return true;
		}

		// var path = require('path');
		// window.contApp.moveCont = require( path.resolve('./app/fncs/movecontents/index_files/app.moveContent.js') );
		// window.contApp.relink = require( path.resolve('./app/fncs/movecontents/index_files/app.relink.js') );

		px.utils.iterate(
			queue ,
			function(it, row, idx){
				$body.text(row.from+'->'+row.to+' : コンテンツを移動しています。');
				window.contApp.moveCont.moveContent( px, _pj, row, function( result ){
					if(!result){
						$body.text(row.from+'->'+row.to+' : コンテンツの移動に失敗しました。');
						$btnOk.removeAttr('disabled');
						it.next();
						return;
					}
					var filelist = getContentsFileList();
					// var filelist = [];
					$body.text(row.from+'->'+row.to+' : リンクを張り替えています。');
					window.contApp.relink.relink( px, _pj, row, filelist, function( result ){
						it.next();
					} );
				} );
			} ,
			function(){
				$body.text('移動処理を完了しました。');
				$btnOk.removeAttr('disabled');
			}
		);

		return true;
	}

	/**
	 * パス置換対象となるコンテンツファイルの一覧を取得する
	 */
	function getContentsFileList( path ){
		if( !path ){ path = '/'; }
		var baseDir = px.fs.realpathSync( _pj.get_realpath_controot() );
		var ls = px.fs.readdirSync( baseDir+path );
		var rtn = []
		for( var idx in ls ){
			if( px.utils.isFile(baseDir+path+ls[idx]) ){
				var proc_type = _pj.get_path_proc_type( path+ls[idx] );
				if( proc_type == 'ignore' ){
					continue;
				}
				rtn.push( path+ls[idx] );
			}else if( px.utils.isDirectory(baseDir+path+ls[idx]) ){
				var children = getContentsFileList( path+ls[idx]+'/' );
				rtn = rtn.concat( children );
			}
		}

		return rtn;
	}

	$(window).load(function(){
		init();
	});

})( window.parent.px );
