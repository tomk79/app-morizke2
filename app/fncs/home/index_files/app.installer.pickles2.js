window.contApp.installer.pickles2 = new (function( px, contApp ){
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
		px.spawnDialog(
			px.cmd('php'),
			[
				px.cmd('composer'),
				'create-project',
				'--no-interaction',
				'pickles2/preset-get-start-pickles2',
				'./',
				'2.0.*'
			],
			{
				cd: path,
				title: 'Pickles 2 プロジェクトのセットアップ',
				description: $msg.text('Pickles 2 プロジェクトをセットアップしています。この処理はしばらく時間がかかります。'),
				success: function(data){
				} ,
				error: function(data){
					// px.message('ERROR: '+data);
					// $msg.text('ERROR: '+data);
					px.log('Composer Setup Error: '+ data);
				} ,
				cmdComplete: function(code){
					$msg.text('Pickles 2 プロジェクトのセットアップが完了しました。');
				},
				complete: function(dataFin){
					opt.complete();
				}
			}
		);
		return this;
	}

})( window.px, window.contApp );
