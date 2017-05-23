window.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }
	var _this = this;
	var pj = this.pj = px.getCurrentProject();
	var it79 = px.it79;

	var pxConf,
		path_controot;

	var $content;
	var broccoli;

	/**
	 * 初期化
	 */
	function init(){
		it79.fnc({},
			[
				function(it1, arg){
					$content = $('.contents');
					pxConf = pj.getConfig();
					path_controot = pj.get_realpath_controot();
					onWindowResize();
					it1.next(arg);
				},
				function(it1, arg){
					var pickles2ModuleEditor = new Pickles2ModuleEditor();
					pickles2ModuleEditor.init(
						{
							'elmCanvas': $content.get(0), // <- 編集画面を描画するための器となる要素
							'preview':{ // プレビュー用サーバーの情報を設定します。
								'origin': 'http://127.0.0.1:8081'
							},
							'gpiBridge': function(input, callback){
								// GPI(General Purpose Interface) Bridge
								// broccoliは、バックグラウンドで様々なデータ通信を行います。
								// GPIは、これらのデータ通信を行うための汎用的なAPIです。
								pj.createPickles2ModuleEditorServer(function(px2me){
									px2me.gpi(input, function(res){
										callback(res);
									});
								});
								return;
							},
							'complete': function(){
								alert('完了しました。');
							},
							'onMessage': function( message ){
								// ユーザーへ知らせるメッセージを表示する
								console.info('message: '+message);
							}
						},
						function(){
							// スタンバイ完了したら呼び出されるコールバックメソッドです。
							it1.next(arg);
						}
					);
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
