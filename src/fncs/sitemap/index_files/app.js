window.px = window.parent.px;
window.contApp = new (function(px, $){
	var _this = this;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var pj = px.getCurrentProject();
	var realpath_sitemap_dir = pj.get('path')+'/'+pj.get('home_dir')+'/sitemaps/';
	var filelist;
	var $filelist;
	this.git = pj.git();
	// console.log(git);
	this.gitUi = new px2dtGitUi(px, pj);

	/**
	 * initialize
	 */
	function init( callback ){
		callback = callback || function(){};

		it79.fnc({}, [
			function(it1, arg){
				$filelist = $('.cont_filelist_sitemap');
				filelist = {};
				it1.next(arg);
			},
			function(it1, arg){
				// --------------------------------------
				// サイトマップファイル名の一覧を整理
				var filelist_original = pj.getSitemapFilelist();
				filelistLoop:for( var idx in filelist_original ){
					var filename_orig = filelist_original[idx];
					var filename = filename_orig.replace(/\.[a-zA-Z0-9]+$/, '');
					var ext = px.utils.getExtension(filename_orig).toLowerCase();
					switch( ext ){
						case 'csv':
						case 'xlsx':
							break;
						default:
							continue filelistLoop;
					}

					try {
						if( !filelist[filename] ){
							filelist[filename] = {};
						}
						filelist[filename].basefilename = filename;
						filelist[filename].masterExt = ext;
						filelist[filename].masterFilename = filename_orig;
						if( !filelist[filename].exts ){
							filelist[filename].exts = {};
						}
						if( !filelist[filename].exts[ext] ){
							filelist[filename].exts[ext] = {};
						}
						filelist[filename].exts[ext].basefilename = filename;
						filelist[filename].exts[ext].filename = filename_orig;
						filelist[filename].exts[ext].ext = ext.toLowerCase();
					} catch (e) {
						console.error('[ERROR] An error occurred while sorting Sitemap file list. -> on "'+filename+'".', e);
					}

				}
				// console.log(filelist);
				it1.next(arg);
			},
			function(it1, arg){
				// --------------------------------------
				// サイトマップファイルのマスターフォーマットを決める
				for( var idx in filelist ){
					var masterExt = null;
					try {
						// 本来は、 px2-sitemapexcel のオプションを確認して、
						// マスターファイルの設定をファイルごとに決めたいところ。
						// いまのところは固定的に xlsx をマスターとして優先する。
						if( filelist[idx].exts.xlsx ){
							masterExt = 'xlsx';
						}else if( filelist[idx].exts.csv ){
							masterExt = 'csv';
						}
					} catch (e) {
					}
					// masterExt = 'csv';
					filelist[idx].masterExt = masterExt;
					filelist[idx].masterFilename = filelist[idx].exts[masterExt].filename;
				}
				it1.next(arg);
			},
			function(it1, arg){
				// --------------------------------------
				// 一覧を描画
				var $ul = $('<ul>').addClass('listview');

				for( var idx in filelist ){

					var $a = $('<a>');

					$ul.append( $('<li>')
						.append( $a
							.attr({
								'href': 'javascript:;',
								'data-filename': filelist[idx].masterFilename,
								'data-num': idx
							})
							.on('click', function(e){
								e.stopPropagation();
								e.preventDefault();
								var path = realpath_sitemap_dir+$(this).attr('data-filename');
								px.utils.openURL( path );
								return false;
							} )
							.append( $('<h2>')
								.text( filelist[idx].masterFilename )
							)
						)
					);

					var $extUl = $('<ul>').addClass('cont_filelist_sitemap__ext-list');
					$a.append($extUl);

					$extUl.append( $('<li>').text('Edit:') );

					for( var ext in filelist[idx].exts ){
						var $aExt = $('<button>');
						var $li = $('<li>')
							.append( $aExt
								.addClass('px2-btn')
								.attr({
									'data-filename': filelist[idx].exts[ext].filename
								})
								.on('click', function(e){
									e.stopPropagation();
									e.preventDefault();
									var path = realpath_sitemap_dir+$(this).attr('data-filename');
									px.utils.openURL( path );
									return false;
								})
								.text( filelist[idx].exts[ext].ext )
							)
						;
						if( ext == filelist[idx].masterExt ){
							$aExt.addClass('px2-btn--primary');
						}
						$extUl.append($li);
					}
					$extUl.append( $('<li>').text('Delete:') );
					$extUl.append( $('<li>').append($('<button>')
						.addClass('px2-btn')
						.addClass('px2-btn--danger')
						.attr({
							'data-basefilename': filelist[idx].exts[ext].basefilename
						})
						.on('click', function(e){
							e.stopPropagation();
							e.preventDefault();
							var basefilename = $(this).attr('data-basefilename');
							if( !confirm('サイトマップファイル "'+basefilename+'" を削除しますか？') ){
								return false;
							}
							pj.deleteSitemapFile(basefilename, function(){
								init();
							});
							return false;
						})
						.text('Delete')
					));
				}


				$filelist
					.html('')
					.append( $ul )
				;
				it1.next(arg);
			},
			function(it1, arg){
				onWindowResized();
				it1.next(arg);
			},
			function(it1, arg){
				callback();
			}
		]);

	}

	/**
	 * サイトマップをコミットする
	 */
	this.commitSitemap = function(){
		this.gitUi.commit('sitemaps', {}, function(result){
			console.log('(コミット完了しました)');
			init();
		});
		return this;
	}

	/**
	 * サイトマップのコミットログを表示する
	 */
	this.logSitemap = function(){
		this.gitUi.log('sitemaps', {}, function(result){
			console.log('(コミットログを表示しました)');
			init();
		});
		return this;
	}

	/**
	 * フォルダを開く
	 */
	this.openInFinder = function(){
		px.utils.openURL( realpath_sitemap_dir );
	}

	/**
	 * マニュアルを開く
	 */
	this.openManual = function(){
		var $body = $('<div>');
		$body.html( $('#template-manual').html() );
		px2style.modal({
			'title': 'サイトマップの編集方法',
			'body': $body
		});
	}

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResized(){
		$('.cont_filelist_sitemap')
			.css({
				'height': $(window).height() - $('.cont_buttons').height() - 100
			})
		;
	}

	/**
	 * 初期化イベント発火
	 */
	$(window)
		.on('load', function(){
			init();
		})
		.on('resize', function(){
			onWindowResized();
		})
	;

})(px, $);
