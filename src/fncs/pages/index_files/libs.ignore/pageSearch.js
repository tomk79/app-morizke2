/**
 * pageSearch.js
 */
module.exports = function(app, px, pj, $elms){
	var it79 = require('iterate79');
	var _this = this;
	var fileterTimer;
	var _sitemap = null;
	var _workspaceSearchKeywords='',
		_workspaceSearchListLabel='title';

	/**
	 * フィルター機能の初期化
	 */
	this.init = function( callback ){
		callback = callback || function(){};

		$elms.searchList.hide(); // 普段は隠しておく

		it79.fnc({}, [
			function(it, prop){
				// --------------------------------------
				// ページ検索機能
				$elms.workspaceSearch.find('form#cont_search_form')
					.on('submit', function(e){
						_workspaceSearchKeywords = $elms.workspaceSearch.find('input[type=text]').val();
						_this.search(function(){});
						return false;
					})
				;
				$elms.workspaceSearch.find('input[type=radio][name=list-label]')
					.off('change')
					.on('change', function(){
						_workspaceSearchListLabel = $elms.workspaceSearch.find('input[type=radio][name=list-label]:checked').val();
						// console.log(_workspaceSearchListLabel);
						clearTimeout(fileterTimer);
						fileterTimer = setTimeout(function(){
							_this.search(function(){});
						}, 1000);
					})
				;
				it.next(prop);
			} ,
			function(it, prop){
				callback();
			}
		]);
		return;
	}

	/**
	 * 検索実行
	 */
	this.search = function( callback ){
		callback = callback || function(){};
		var maxHitCount = 200;
		var hitCount = 0;
		$elms.searchList.hide(); // 一旦隠す
		if( !_workspaceSearchKeywords.length ){
			callback();
			return;
		}

		it79.fnc({}, [
			function(it, prop){
				if( _sitemap === null ){
					pj.site.updateSitemap(function(){
						_sitemap = pj.site.getSitemap();
						if( _sitemap === null ){
							px.message('[ERROR] サイトマップが正常に読み込まれていません。');
						}
						it.next(prop);
					});
					return;
				}
				it.next(prop);
			} ,
			function(it, prop){
				var $ul = $('<ul class="listview">');
				// $elms.searchList.text( JSON.stringify(_sitemap) );

				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						current = (typeof(current)==typeof('')?current:'');

						$elms.searchList.html('').append($ul);

						function isMatchKeywords(target){
							if( typeof(target) != typeof('') ){
								return false;
							}
							if( target.match(_workspaceSearchKeywords) ){
								return true;
							}
							return false;
						}
						it79.ary(
							_sitemap,
							function( it1, row, idx ){
								// console.log(_sitemap[idx].title);
								if( _workspaceSearchKeywords.length ){
									if(
										!isMatchKeywords(_sitemap[idx].id) &&
										!isMatchKeywords(_sitemap[idx].path) &&
										!isMatchKeywords(_sitemap[idx].content) &&
										!isMatchKeywords(_sitemap[idx].title) &&
										!isMatchKeywords(_sitemap[idx].title_breadcrumb) &&
										!isMatchKeywords(_sitemap[idx].title_h1) &&
										!isMatchKeywords(_sitemap[idx].title_label) &&
										!isMatchKeywords(_sitemap[idx].title_full)
									){
										// console.log('=> skiped.');
										it1.next();
										return;
									}
								}
								if(hitCount >= maxHitCount){
									// 検索件数上限を越えた場合
									$elms.searchList.append( $('<p>')
										.text('検索数が '+maxHitCount+'件 をこえました。')
									);
									rlv();
									return;
								}
								hitCount ++;
								$ul.append( $('<li>')
									.append( $('<a>')
										.text( function(){
											return _sitemap[idx][_workspaceSearchListLabel];
										} )
										.attr( 'href', 'javascript:;' )
										.attr( 'data-id', _sitemap[idx].id )
										.attr( 'data-page-path', _sitemap[idx].path )
										.attr( 'data-content', _sitemap[idx].content )
										.css({
											// ↓暫定だけど、階層の段をつけた。
											'padding-left': (function(pageInfo){
												if( _workspaceSearchListLabel != 'title' ){ return '1em'; }
												if( !_sitemap[idx].id.length ){ return '1em'; }
												if( !_sitemap[idx].logical_path.length ){ return '2em' }
												var rtn = ( (_sitemap[idx].logical_path.split('>').length + 1) * 1.3)+'em';
												return rtn;
											})(_sitemap[idx]),
											'font-size': '12px'
										})
										.on('click', function(){
											app.goto( $(this).attr('data-page-path'), {"force":true}, function(){} );
										} )
									)
								);
								it1.next();
							},
							function(){
								rlv();
							}
						);
					}); })
					.then(function(){ return new Promise(function(rlv, rjt){
						it.next(prop);
					}); })
				;
			} ,
			function(it, prop){
				$elms.searchList.show();
				if(!hitCount){
					$elms.searchList.html('').append( $('<p>')
						.text('該当するページがありません。')
					);
				}
				it.next(prop);
			} ,
			function(it, prop){
				// カレント表示反映
				var current = app.getCurrentPageInfo();
				// console.log(current.page_info.id);
				try {
					$elms.searchList.find('a').removeClass('current');
					$elms.searchList.find('a[data-id="'+current.page_info.id+'"]').addClass('current');
				} catch (e) {
				}
				it.next(prop);
			} ,
			function(it, prop){
				// ページ一覧の表示更新
				callback();
			}
		]);
		return;
	}
}
