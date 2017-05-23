window.px = window.parent.px;
window.contApp = new (function(){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var status = pj.status();
	var $cont, $btnGitInit, $btnGitStatus, $pre;

	/**
	 * initialize
	 */
	function init(){
		$cont = $('.contents').html('');
		$btnGitInit = $('<button class="btn px2-btn">');
		$btnGitStatus = $('<button class="btn px2-btn">');
		$pre = $('<pre>');

		if( !status.gitDirExists ){
			// git init しなくてはいけない場合
			$cont
				.append( $($('#template-toInitialize-message').html()) )
				.append( $btnGitStatus
					.click( function(){ git_init(this); } )
					.text('gitを初期化する')
					.css({
						'width':'100%'
					})
				)
				.append( $pre
					.addClass( 'cont_console' )
					.css({
						'max-height': 360,
						'height': 360
					})
				)
			;
		}else{
			// gitリポジトリが存在する場合
			$cont
				.append( $btnGitStatus
					.click( function(){ git_status(this); } )
					.text('ステータスを表示する')
					.css({
						'width':'100%'
					})
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
	}

	function git_init(btn){
		$(btn).attr('disabled', 'disabled');
		var pj = px.getCurrentProject();
		$('.cont_console').text('');
		window.px.utils.spawn('git',
			['init'],
			{
				cd: pj.get('path'),
				success: function(data){
					$('.cont_console').text(
						$('.cont_console').text() + data
					);
				} ,
				error: function(data){
					$('.cont_console').text(
						$('.cont_console').text() + data
					);
				} ,
				complete: function(code){
					$(btn).removeAttr('disabled');
					px.message( 'gitを初期化しました。' );
					px.subapp('fncs/git/index.html');
				}
			}
		);
	}

	function git_status(btn){
		$(btn).attr('disabled', 'disabled');
		var pj = px.getCurrentProject();
		$('.cont_console').text('');
		px.execDialog(
			'git status',
			{
				cd: pj.get_realpath_git_root(),
				title: '$ git status',
				description: $('<p>').text('gitのステータス状態を表示します。'),
				complete: function(stdout){
					$('.cont_console').text( stdout );
					$(btn).removeAttr('disabled').focus();
					px.message( 'gitのステータス表示を完了しました。' );
				}
			}
		);
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})();
