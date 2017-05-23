window.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }
	var _this = this;
	var pj = this.pj = px.getCurrentProject();
	var it79 = px.it79;

	var pxConf,
		path_controot,
		path_homedir;

	var $content;
	var broccoli,
		broccoliStyleGuideGen;

	/**
	 * 初期化
	 */
	function init(){
		it79.fnc({},
			[
				function(it1, arg){
					$content = $('.contents');
					pxConf = pj.getConfig();
					console.log(pxConf);
					pj.px2proj.get_path_homedir(function(_homedir){
						console.log(_homedir);
						path_homedir = _homedir;
						path_controot = pj.get_realpath_controot();
						onWindowResize();
						it1.next(arg);
					});
				},
				function(it1, arg){
					// broccoli を生成
					pj.createBroccoliServer('/index.html', function(b){
						broccoli = b;
						console.log(broccoli);
						it1.next(arg);
					});
				},
				function(it1, arg){
					// broccoliStyleGuideGen
					broccoliStyleGuideGen = new px.BroccoliStuleGuideGen(broccoli);
					// console.log(broccoliStyleGuideGen);
					it1.next(arg);
				},
				function(it1, arg){
					$('.contents').append( $('<div>')
						.append( $('<p>')
							.text('この操作は、 登録されているモジュールのリストからスタイルガイドを生成します。')
						)
						.append( $('<p>')
							.text('ホームディレクトリに styleguide フォルダを生成します。')
						)
						.append( $('<button class="px2-btn px2-btn--primary">')
							.text('スタイルガイドを生成する')
							.on('click', function(e){
								console.log('start generating styleguide...');
								try {
									px.fs.mkdirSync( path_homedir+'styleguide/' );
								} catch (e) {
								}
								try {
									broccoliStyleGuideGen.generate(path_homedir+'styleguide/', {}, function(result){
										// ↓broccoliStyleGuideGen では、SASSとnodeのバージョンが合わず
										// SASSのコンパイルで異常終了する。
										// そのための代替手段として、 px2dthelper にCSSのビルドを委託する。
										pj.px2proj.query('/?PX=px2dthelper.document_modules.build_css', {
											"output": "json",
											"userAgent": "Mozilla/5.0",
											"success": function(row){
												// console.log(row);
											},
											"complete": function(bin, code){
												// console.log(bin, code);
												px.fs.writeFileSync( path_homedir+'styleguide/index_files/styles.css', bin );
												alert('done.');
											}
										});
									});
								} catch (e) {
									console.error('ERROR: Failed to generate styleguide.', e);
								}
							})
						)
						.append( $('<button class="px2-btn">')
							.text('出力先を開く')
							.on('click', function(e){
								if( !px.utils79.is_dir(path_homedir+'styleguide/') ){
									alert('スタイルガイドが生成されていません。');
									return false;
								}
								px.utils.openURL( path_homedir+'styleguide/' );
							})
						)
					);
					it1.next(arg);

				},
				function(it1, arg){
					console.info('standby OK.');
					it1.next(arg);
				}
			]
		);
	}// init()

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$content.css({
			'height': $(window).height() - $('.container').eq(0).height() - 10
		});
	}

	$(function(){
		init();
		$(window).resize(function(){
			onWindowResize();
		});

	});

})( window.parent.px );
