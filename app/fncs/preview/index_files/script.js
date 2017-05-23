window.px = window.parent.px;
(function(){
	var $preview, $preview_frame;

	function cont_start_preview(){
		px.preview.serverStandby( function(){
			$preview_frame.attr( 'src', px.preview.getUrl() );

			// ↓MEMO: 外部サイトをiframe内に読み込んだ際に任意のコードを実行できるセキュリティ上の課題について考えた時のメモ。
			// - iframe内のコンテンツが unload する前に beforeunload が発生するが、ここでは次のページのURLはわからない。
			// - unload が発生した段階では、もう遷移を中断することはできない。ちなみに、このタイミングでも次のURLはわからない。
			// - 次の画面の onload 時点ではさすがにURLは取得できるが、ロードしたページのコードを実行した後に発生するので、セキュリティ上の問題解決としては不十分。
			$preview_frame.bind('load', function(e){
				console.log('iframe "load" fired.');
				var winIFrame = this.contentWindow;
				console.log( winIFrame.location );
				// $(winIFrame).bind('beforeload', function(e){
				// 	console.log('contentWindow "beforeload" fired.');
				// });
				// $(winIFrame).bind('pageshow', function(e){
				// 	console.log('contentWindow "pageshow" fired.');
				// });
				// $(winIFrame).bind('beforeunload', function(e){
				// 	console.log('contentWindow "beforeunload" fired.');
				// 	console.log( e );
				// 	return 'realy to continue?';
				// });
				// $(winIFrame).bind('unload', function(e){
				// 	console.log('contentWindow "unload" fired.');
				// 	console.log(e);
				// 	console.log(e.target.URL);
				// 	e.preventDefault();
				// 	e.stopPropagation();
				// 	return false;
				// 	return 'realy to continue?';
				// });
				// $(winIFrame).bind('pagehide', function(e){
				// 	console.log('contentWindow "pagehide" fired.');
				// 	console.log(e.target.URL);
				// });
				px.cancelDrop(winIFrame);

			});
			// $preview_frame.bind('unload', function(e){
			// 	console.log('iframe "unload" fired.');
			// });

		} );
	}
	function cont_resize(){
		$preview
			.css({
				'display': 'block',
				'height': $(window).height() - 40
			})
		;
	}
	$(window).load(function(){
		$preview = $('.cont_preview_frame');
		$preview_frame = $preview.find('iframe');

		cont_start_preview();
		$(window).resize();

	});
	$(window).resize(function(){
		cont_resize();
	});

})();
