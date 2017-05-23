/**
 * Publish: app.js
 */
window.px = window.parent.px;
window.contApp = new (function(px, $){
	var _this = this;
	var _pj, _realpathPublishDir;
	var $cont;
	var _status;
	var _patterns;

	/**
	 * initialize
	 */
	function init(){
		px.progress.start({
			'blindness':false
		});

		_pj = px.getCurrentProject();
		_realpathPublishDir = px.path.resolve( _pj.get('path')+'/'+_pj.get('home_dir')+'/_sys/ram/publish/' )+'/';
		$cont = $('.contents');
		$cont.html('');

		try {
			// パブリッシュパターンの設定を読み込む。
			_patterns = _pj.getConfig().plugins.px2dt.publish_patterns;
		} catch (e) {
		}

		px.utils.iterateFnc([
			function(it, arg){
				px.fs.exists( _realpathPublishDir+'applock.txt', function(result){
					arg.applockExists = result;
					it.next(arg);
				} );
			} ,
			function(it, arg){
				px.fs.exists( _realpathPublishDir+'publish_log.csv', function(result){
					arg.publishLogExists = result;
					it.next(arg);
				} );
			} ,
			function(it, arg){
				px.fs.exists( _realpathPublishDir+'alert_log.csv', function(result){
					arg.alertLogExists = result;
					it.next(arg);
				} );
			} ,
			function(it, arg){
				px.fs.exists( _realpathPublishDir+'htdocs/', function(result){
					arg.htdocsExists = result;
					it.next(arg);
				} );
			} ,
			function(it, arg){
				_status = arg;
				if( _status.applockExists ){
					// パブリッシュ中だったら
					$cont.append( $('#template-on_publish').html() );
				}else if( _status.publishLogExists && _status.htdocsExists ){
					// パブリッシュが完了していたら
					$cont.append( $('#template-after_publish').html() );
					$cont.find('.cont_canvas')
						.height( $(window).height() - $('.container').eq(0).height() - $cont.find('.cont_buttons').height() - 20 )
					;
					_this.resultReport.init( _this, $cont.find('.cont_canvas') );
				}else{
					// パブリッシュ前だったら
					$cont.append( $('#template-before_publish').html() );
				}
				// console.log(arg);
				it.next(arg);
			} ,
			function(it, arg){
				setTimeout(function(){
					px.progress.close();
					it.next(arg);
				}, 10);
			}
		]).start({});
	}

	/**
	 * パブリッシュを実行する
	 */
	this.publish = function(){
		var $body = $( $('#template-dialog_publish_options').html() );

		(function(){
			// パブリッシュパターンの選択UIを作る
			var $pattern = $body.find('.cont_form_pattern');
			$pattern.css({
				'margin':'1em auto'
			});
			try {
				// console.log(patterns);
				if( typeof(_patterns) !== typeof([]) || !_patterns.length){
					$pattern.remove();
				}else{
					var $select = $pattern.find('select');
					$select.append('<option value="">select pattern...</option>');
					for( var idx in _patterns ){
						var $opt = $('<option>');
						$opt.attr({'value': idx});
						$opt.text( _patterns[idx].label );
						$select.append($opt);
					}
					$select.change(function(){
						var selectedValue = $(this).val();
						// alert(selectedValue);
						var data = _patterns[selectedValue];
						$(this).val('');
						if( !data ){
							alert('ERROR: 設定を読み込めません。');
							return;
						}
						try {
							$body.find('textarea[name=path_region]').val( data.paths_region.join("\n") );
						} catch (e) {
							$body.find('textarea[name=path_region]').val( '/' );
						}
						try {
							$body.find('textarea[name=paths_ignore]').val( data.paths_ignore.join("\n") );
						} catch (e) {
							$body.find('textarea[name=paths_ignore]').val( '' );
						}
						try {
							$body.find('input[name=keep_cache]').prop("checked", !!(data.keep_cache));
						} catch (e) {
							$body.find('input[name=keep_cache]').prop("checked", false);
						}
						return;
					});
				}
			} catch (e) {
				// 設定されていなかったら選択欄を削除
				$pattern.remove();
			}
		})();

		px.dialog({
			'title': 'パブリッシュ',
			'body': $body,
			'buttons':[
				$('<button>')
					.text('パブリッシュを実行する')
					.attr({'type':'submit'})
					.addClass('px2-btn px2-btn--primary')
					.click(function(){
						var str_paths_region_val = $body.find('textarea[name=path_region]').val();
						var str_paths_region = '';
						var tmp_ary_paths_region = str_paths_region_val.split(new RegExp('\r\n|\r|\n','g'));
						var ary_paths_region = [];
						for( var i in tmp_ary_paths_region ){
							tmp_ary_paths_region[i] = px.php.trim(tmp_ary_paths_region[i]);
							if( px.php.strlen(tmp_ary_paths_region[i]) ){
								ary_paths_region.push( tmp_ary_paths_region[i] );
							}
						}
						if( !ary_paths_region.length ){
							alert('パブリッシュ対象が指定されていません。1件以上指定してください。');
							return true;
						}
						var path_region = ary_paths_region.shift();

						var str_paths_ignore_val = $body.find('textarea[name=paths_ignore]').val();
						var str_paths_ignore = '';
						var ary_paths_ignore = str_paths_ignore_val.split(new RegExp('\r\n|\r|\n','g'));
						for( var i in ary_paths_ignore ){
							ary_paths_ignore[i] = px.php.trim(ary_paths_ignore[i]);
							if( !px.php.strlen(ary_paths_ignore[i]) ){
								ary_paths_ignore[i] = undefined;
								delete(ary_paths_ignore[i]);
							}
						}
						if( typeof(ary_paths_ignore) == typeof('') ){
							ary_paths_ignore = [ary_paths_ignore];
						}

						var keep_cache = ( $body.find('input[name=keep_cache]:checked').val() ? 1 : 0 );

						px.closeDialog();

						_this.progressReport.init(
							_this,
							$cont,
							{
								"path_region": path_region,
								"paths_region": ary_paths_region,
								"paths_ignore": ary_paths_ignore,
								"keep_cache": keep_cache,
								"complete": function(){
									px.message( 'パブリッシュを完了しました。' );
									init();
								}
							}
						);
					}),
				$('<button>')
					.text(px.lb.get('ui_label.cancel'))
					.addClass('px2-btn')
					.click(function(){
						px.closeDialog();
					})
			]
		});

		return true;
	}

	/**
	 * 一時パブリッシュ先ディレクトリを開く
	 */
	this.open_publish_tmp_dir = function(){
		window.px.utils.openURL(_pj.get('path')+'/'+_pj.get('home_dir')+'/_sys/ram/publish/');
	}

	/**
	 * パブリッシュ先ディレクトリを開く
	 */
	this.open_publish_dir = function(){
		var conf = _pj.getConfig();
		if( !conf.path_publish_dir ){
			alert('パブリッシュ先ディレクトリは設定されていません。\nプロジェクト設定(config.php) で $conf->path_publish_dir を設定してください。');
			return;
		}

		var path = '';
		if( typeof(conf.path_publish_dir) == typeof('') ){
			path = px.path.resolve( px.php.dirname(_pj.get('path')+'/'+_pj.get('entry_script')), conf.path_publish_dir );
		}
		if( !px.utils.isDirectory(path) ){
			alert('設定されたパブリッシュ先ディレクトリが存在しません。存在する有効なディレクトリである必要があります。\nプロジェクト設定(config.php) で $conf->path_publish_dir を設定してください。');
			return;
		}
		window.px.utils.openURL(path);
	}

	/**
	 * パブリッシュ中状態からの復旧方法の開閉
	 */
	this.toggle_how_to_recovery_on_publish = function(target,a){
		var $this = $(a);
		var $target = $(target);
		$target.toggle('fast',function(){
			$this.removeClass('glyphicon-menu-right').removeClass('glyphicon-menu-down');
			if( $target.is(":hidden") ){
				$this.addClass('glyphicon-menu-right');
			}else{
				$this.addClass('glyphicon-menu-down');
			}
		});
	}

	/**
	 * ステータスを取得
	 */
	this.getStatus = function(){
		return _status;
	}

	/**
	 * パブリッシュディレクトリのパスを取得
	 */
	this.getRealpathPublishDir = function(){
		return _realpathPublishDir;
	}


	$(window).load(function(){
		init();
	});
	$(window).resize(function(){
		$('.cont_canvas')
			.height( $(window).height() - $('.container').eq(0).height() - $cont.find('.cont_buttons').height() - 20 )
		;
	});

	return this;
})(px, $);
