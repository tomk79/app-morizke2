window.px = window.parent.px;
window.contApp = new (function(px){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var $cont, $btn, $pre;

	/**
	 * initialize
	 */
	function init(){
		$cont = $('.contents').html('');
		$btn = $('<button class="px2-btn px2-btn--block">');
		$pre = $('<pre>');

		$cont
			.append( $btn
				.click( function(){ rebuild(this); } )
				.text('すべてのGUI編集コンテンツを一括再構成する')
			)
			.append( $pre
				.addClass( 'cont_console' )
				.css({
					'max-height': 360,
					'height': 360
				})
			)
		;
	}


	var rebuild = function(btn){
		$(btn).attr('disabled', 'disabled');
		$pre.text('');

		pj.createSearcher().getGuiEditPages( function(pageList){

			px.utils.iterate(
				pageList ,
				function( it1, sitemapRow, idx1 ){
					console.log(sitemapRow);
					$pre.text( $pre.text() + sitemapRow.path );

					px.utils.iterateFnc([
						function(it2, arg2){
							// HTMLコンテンツのみ抽出
							var procType = pj.get_path_proc_type( arg2.pageInfo.path );
							$pre.text( $pre.text() + ' -> ' + procType );
							switch( procType ){
								case 'html':
								case 'htm':
									it2.next(arg2);
									break;
								default:
									$pre.text( $pre.text() + ' -> SKIP' );
									$pre.text( $pre.text() + "\n" );
									it1.next();
									break;
							}
						} ,
						function(it2, arg2){
							// そのうち、GUI編集コンテンツのみ抽出
							pj.getPageContentEditorMode( arg2.pageInfo.path, function(procType){
								$pre.text( $pre.text() + ' -> ' + procType );
								switch( procType ){
									case 'html.gui':
										it2.next(arg2);
										break;
									default:
										$pre.text( $pre.text() + ' -> SKIP' );
										$pre.text( $pre.text() + "\n" );
										it1.next();
										break;
								}
							} );
						} ,
						function(it2, arg2){
							// broccoli コンテンツを再生成する
							pj.buildGuiEditContent( arg2.pageInfo.path, function(result){
								if(result){
									$pre.text( $pre.text() + ' -> done' );
								}else{
									$pre.text( $pre.text() + ' -> ERROR!' );
								}
								$pre.text( $pre.text() + "\n" );
								it2.next(arg2);
							} );
						} ,
						function(it2, arg2){
							it1.next();
						}
					]).start({"pageInfo": sitemapRow});

				} ,
				function(){
					$pre.text( $pre.text() + 'completed!' );
					$(btn).removeAttr('disabled').focus();
					px.message( '完了しました。' );
				}
			);

		} );
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})(window.px);
