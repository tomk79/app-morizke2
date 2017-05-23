window.contApp.installer.git = new (function( px, contApp ){
	var _this = this;

	/**
	 * インストールを実行
	 */
	this.install = function( pj, param, opt ){

		var path = pj.get('path');
		if( px.utils.isFile( path+'/.DS_Store' ) ){
			px.fs.unlinkSync( path+'/.DS_Store' );
		}
		if( px.utils.isFile( path+'/Thumbs.db' ) ){
			px.fs.unlinkSync( path+'/Thumbs.db' );
		}

		var $msg = $('<div>');

		var $dialog;
		var stdout = '';

		var $pre = $('<pre>')
			.css({
				'height':'12em',
				'overflow':'auto'
			})
			.addClass('selectable')
			.text('実行中...')
		;

		var dlgOpt = {};
		dlgOpt.title = 'Pickles 2 のセットアップ';
		dlgOpt.body = $('<div>')
			.append( $msg.text('Gitリポジトリからクローンしています。この処理はしばらく時間がかかります。') )
			.append( $pre )
		;
		dlgOpt.buttons = [
			$('<button>')
				.text('OK')
				.click(function(){
					// これがセットアップ完了の最後の処理
					px.closeDialog();
					opt.complete();
				})
				.attr({'disabled':'disabled'})
		];

		$dialog = px.dialog( dlgOpt );

		px.utils.iterateFnc([
			function(it, prop){
				// `$ git clone` しています。
				// px.git.Clone(prop.param.repositoryUrl, path)
				// 	.then(function(repository) {
				// 		// Work with the repository object here.
				// 		it.next(prop);
				// 	})
				// ;

				px.utils.spawn(
					px.cmd('git'), ['clone', param.repositoryUrl, './'],
					{
						cd: path,
						success: function(data){
							stdout += data;
							$pre.text(stdout);
						} ,
						error: function(data){
							stdout += data;
							$pre.text(stdout);
							px.log('Composer Setup Error: '+ data);
						} ,
						complete: function(code){
							it.next(prop);
						}
					}
				);

			} ,
			function(it, prop){
				$msg.text('composer をセットアップしています。この処理はしばらく時間がかかります。');
				var path_composer = pj.get_realpath_composer_root();
				px.utils.spawn(
					px.cmd('php'),
					[px.cmd('composer'), 'install', '--no-interaction'],
					{
						cd: path_composer,
						success: function(data){
							stdout += data;
							$pre.text(stdout);
						} ,
						error: function(data){
							stdout += data;
							$pre.text(stdout);
							px.log('Composer Setup Error: '+ data);
						} ,
						cmdComplete: function(code){
							$msg.text('Pickles のセットアップが完了しました。');
						},
						complete: function(dataFin){
							it.next(prop);
						}
					}
				);
			} ,
			function(it, prop){
				dlgOpt.buttons[0].removeAttr('disabled').focus();
				it.next(prop);
			}
		]).start({param: param});

		return this;
	}

})( window.px, window.contApp );
