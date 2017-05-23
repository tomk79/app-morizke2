/**
 * px.watcher
 */
module.exports = function( px ){
	var _this = this;
	var _pj;
	var _watcher;
	var $ = px.$;
	this.px = px;

	var liveStatus = {
		'making_sitemap_cache': false,
		'publishing': false
	};
	var _targetPath, _pathHomedir;

	var $report = $('<div>');
	$report
		.addClass('theme_ui_px_live_report')
		.addClass('theme_ui_px_live_report--hidden')
	;
	$('body').append($report);

	/**
	 * ファイル監視を開始する
	 * @return {[type]} [description]
	 */
	this.start = function(pj){
		_pj = pj;
		_targetPath = px.path.resolve(pj.get('path'));
		_pathHomedir = px.path.resolve(pj.get('path')+'/'+pj.get('home_dir'));
		this.stop();

		if( !px.utils.isDirectory( _targetPath ) ){
			// ディレクトリが存在しないなら、監視は行わない。
			console.log('対象ディレクトリが存在しないため、 fs.watch を起動しません。', _targetPath);
			return;
		}

		// console.log(pj.get('path'));
		_watcher = px.fs.watch(
			_targetPath,
			{
				"recursive": true
			},
			function(event, filename) {
				var fileInfo = {};
				fileInfo.realpath = px.path.resolve(_targetPath+'/'+filename);
				// console.log(event + ' - ' + fileInfo.realpath);
				updateStatus(fileInfo);
			}
		);

		// 初期状態を確認
		updateStatus({'realpath': px.path.resolve(_pathHomedir+'/_sys/ram/caches/sitemaps/making_sitemap_cache.lock.txt')});
		updateStatus({'realpath': px.path.resolve(_pathHomedir+'/_sys/ram/publish/applock.txt')});

		return;
	}

	/**
	 * ファイル監視を停止する
	 * @return {[type]} [description]
	 */
	this.stop = function(){
		try {
			$report
				.removeClass('theme_ui_px_live_report--hidden')
				.addClass('theme_ui_px_live_report--hidden')
			;
			_watcher.close();
		} catch (e) {
		}
		return;
	}

	/**
	 * ライブステータスを更新
	 */
	function updateStatus(fileInfo){
		// console.info(fileInfo);
		switch( fileInfo.realpath ){
			case px.path.resolve( _pathHomedir+'/_sys/ram/caches/sitemaps/making_sitemap_cache.lock.txt' ):
				if( px.utils79.is_file(fileInfo.realpath) ){
					liveStatus.making_sitemap_cache = true;
				}else{
					liveStatus.making_sitemap_cache = false;
				}
				break;
			case px.path.resolve( _pathHomedir+'/_sys/ram/publish/applock.txt' ):
				if( px.utils79.is_file(fileInfo.realpath) ){
					liveStatus.publishing = true;
				}else{
					liveStatus.publishing = false;
				}
				break;
		}

		var msg = '';
		if( liveStatus.publishing ){
			msg = 'パブリッシュしています...';
		}else if( liveStatus.making_sitemap_cache ){
			msg = 'サイトマップキャッシュを生成しています...';
		}
		if( msg.length ){
			$report
				.text(msg)
				.removeClass('theme_ui_px_live_report--hidden')
			;
		}else{
			$report
				.removeClass('theme_ui_px_live_report--hidden')
				.addClass('theme_ui_px_live_report--hidden')
			;
		}
		return;
	}

	return this;
};
