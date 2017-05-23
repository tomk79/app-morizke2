/**
 * progress window
 */
module.exports.init = function( px, $ ) {
	// この機能は、画面全体をロックしてプログレス画面を表示します。
	// プログレス画面を表示している間は、キーボードやマウスの操作を受け付けません。
	// 見えないフォーム `$keycatcher` にフォーカスを当て、キーボード操作を拾って捨てています。

	var htmlProgress = ''
		+'<div class="progress">'+"\n"
		+'  <div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 100%">'+"\n"
		+'    <span class="sr-only"></span>'+"\n"
		+'  </div>'+"\n"
		+'</div>'+"\n"
	;

	var _this = this;
	var $keycatcher = $('<input>');
	var $progress = $('<div>')
		.append( $keycatcher
			.css({
				'border':'none',
				'background':'transparent',
				'opacity':'0.1'
			})
			.bind( 'keydown', function(e){
				// console.log('keydown');
				px.message('キーボード操作をキャンセルしました。');

				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
		)
		.bind( 'mousedown', function(e){stopKeyboard();} )
		.bind( 'mouseup', function(e){stopKeyboard();} )
		.bind( 'click', function(e){stopKeyboard();} )
		.append( $('<div class="px2dt-progress-bar">')
			.css({
				'width': '600px',
				'max-width': '80%',
				'margin': 'auto auto'
			})
			.append( $('<div>')
				.html(htmlProgress)
			)
			.append( $('<div>')
				.css({
					'color':'#fff',
					'text-align': 'center'
				})
				.html('しばらくお待ちください...')
			)
		)
	;

	function stopKeyboard(){
		$keycatcher.focus();
	}

	/**
	 * プログレス画面を表示
	 */
	this.start = function( options ){
		options = (options?options:{});
		$progress
			.css({
				'background': (options.blindness?'rgba(0, 0, 0, 0.5)':'rgba(0, 0, 0, 0)'),
				'width': '100%',
				'height': '100%',
				'position': 'fixed',
				'top': 0, 'left': 0,
				'z-index': 15000
			})
		;
		if( options.showProgressBar ){
			$progress.find('.px2dt-progress-bar').show();
		}else{
			$progress.find('.px2dt-progress-bar').hide();
		}
		$('body').append( $progress );
		stopKeyboard();
		return this;
	}

	/**
	 * プログレス画面を閉じる
	 */
	this.close = function(){
		$progress.remove();
		return this;
	}

	$(window).resize(function(){
		$progress
			.css({
				'width': $(window).width(),
				'height': $(window).height()
			})
		;
	});

	return this;
};
