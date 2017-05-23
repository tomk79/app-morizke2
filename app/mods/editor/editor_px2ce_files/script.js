window.px = window.parent.px;
window.contApp = new (function( px ){
	var _this = this;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var php = require('phpjs');
	var _pj = px.getCurrentProject();
	var pickles2ContentsEditor = new Pickles2ContentsEditor();
	var resizeTimer;

	var _param = px.utils.parseUriParam( window.location.href );

	function resizeEvent(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function(){
			fitWindowSize(function(){
				if(pickles2ContentsEditor.redraw){
					pickles2ContentsEditor.redraw();
				}
			});
		}, 500);
		return;
	}
	function fitWindowSize(callback){
		callback = callback||function(){};
		callback();
		return;
	}

	function init(){
		it79.fnc({}, [
			function(it1, data){
				px.cancelDrop( window );
				fitWindowSize(function(){
					it1.next(data);
				});

			},
			function(it1, data){

				var _page_url = px.preview.getUrl( _param.page_path );
				var elmA = document.createElement('a');
				elmA.href = _page_url;

				window.contAppPx2CEServer(px, _param.page_path, function(px2ceServer){
					pickles2ContentsEditor.init(
						{
							'page_path': _param.page_path , // <- 編集対象ページのパス
							'elmCanvas': document.getElementById('canvas'), // <- 編集画面を描画するための器となる要素
							'preview':{ // プレビュー用サーバーの情報を設定します。
								'origin': elmA.origin
							},
							'customFields': _pj.mkBroccoliCustomFieldOptionFrontend(window, false),
							'lang': px.getDb().language,
							'gpiBridge': function(input, callback){
								// GPI(General Purpose Interface) Bridge
								// broccoliは、バックグラウンドで様々なデータ通信を行います。
								// GPIは、これらのデータ通信を行うための汎用的なAPIです。
								px2ceServer.gpi(
									input,
									function(rtn){
										callback(rtn);
									}
								);
								return;
							},
							'complete': function(){
								window.parent.contApp.closeEditor();
							},
							'onClickContentsLink': function( url, data ){
								// console.log(url);
								// console.log(data);
								// function preg_quote(str, delimiter){
								// 	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
								// }
								_page_url.match(new RegExp('^([a-zA-Z0-9]+\\:\\/\\/[^\\/]+\\/)'));
								var currentDomain = RegExp.$1;

								if( url.match( new RegExp(px.utils.escapeRegExp( currentDomain )) ) ){
									// プレビューサーバーのドメインと一致したら、通す。
								}else if( url.match( new RegExp('^(?:[a-zA-Z0-9]+\\:|\\/\\/)') ) ){
									alert('リンク先('+url+')は管理外のURLです。');
									return;
								}
								var to = url;
								var pathControot = px.preview.getUrl();
								to = to.replace( new RegExp( '^'+px.utils.escapeRegExp( pathControot ) ), '/' );
								to = to.replace( new RegExp( '^\\/+' ), '/' );

								if( to != _param.page_path ){
									if( !confirm( '"'+to+'" へ遷移しますか?' ) ){
										return;
									}
									window.parent.contApp.openEditor( to );
								}
							},
							'onMessage': function( message ){
								px.message(message);
							}
						},
						function(){
							// スタンバイ完了したら呼び出されるコールバックメソッドです。
							it1.next(data);
						}
					);
				});
			} ,
			function(it1, _data){
				px.progress.close();
				console.info('standby!!');
			}
		]);

		return;
	}

	$(function(){
		init();
	})
	$(window).resize(function(){
		resizeEvent();
	});

})( window.parent.px );
