(function(px, $, window){

	px.editPx2DTConfig = function(){
		var $tpl = $( $('#template-editPx2DTConfig').html() );

		if( !px.getDb().commands ){ px.getDb().commands = {}; }

		if( !px.getDb().network ){ px.getDb().network = {}; }
		if( !px.getDb().network.preview ){ px.getDb().network.preview = {}; }
		if( !px.getDb().network.preview.port ){ px.getDb().network.preview.port = null; }
		if( !px.getDb().network.preview.accessRestriction ){ px.getDb().network.preview.port = 'loopback'; }
		if( !px.getDb().network.appserver ){ px.getDb().network.appserver = {}; }
		if( !px.getDb().network.appserver.port ){ px.getDb().network.appserver.port = null; }

		if( !px.getDb().apps ){ px.getDb().apps = {}; }
		if( !px.getDb().apps.texteditor ){ px.getDb().apps.texteditor = null; }
		if( !px.getDb().apps.texteditorForDir ){ px.getDb().apps.texteditorForDir = null; }
		if( !px.getDb().language ){ px.getDb().language = 'ja'; }

		$tpl.find('[name=php]').val( px.getDb().commands.php );
		$tpl.find('[name=git]').val( px.getDb().commands.git );
		$tpl.find('[name=network_preview_port]').val( px.getDb().network.preview.port ).attr({'placeholder':px.packageJson.pickles2.network.preview.port});
		$tpl.find('[name=network_preview_access_restriction]').val( px.getDb().network.preview.accessRestriction );
		$tpl.find('[name=network_appserver_port]').val( px.getDb().network.appserver.port ).attr({'placeholder':px.packageJson.pickles2.network.appserver.port});
		$tpl.find('[name=apps_texteditor]').val( px.getDb().apps.texteditor );
		$tpl.find('[name=apps_texteditor_for_dir]').val( px.getDb().apps.texteditorForDir );
		$tpl.find('[name=language]').val( px.getDb().language );

		var fileInputs = [
			'php',
			'git',
			'apps_texteditor',
			'apps_texteditor_for_dir'
		];
		for(var idx in fileInputs){
			if( px.getPlatform()=='win' ){
				$tpl.find('[name='+fileInputs[idx]+'__file]')
					.bind('change', function(){
						var val = $(this).val();if(!val){return;}
						var name = $(this).attr('name');
						name = name.replace(new RegExp('__file$'), '');
						$tpl.find('[name='+name+']').val( val );
					})
					.hide()
				;
				$tpl.find('.'+fileInputs[idx]+'__file').click(function(){
					var name = $(this).attr('class');
					$('[name='+name+']').click();
				});
			}else{
				// Macでは上手く動かなかった。 → ボタン削除
				$tpl.find('[name='+fileInputs[idx]+'__file]').remove();
				$tpl.find('.'+fileInputs[idx]+'__file').remove();
			}
		}

		px.dialog({
			title: px.packageJson.window.title+" "+px.lb.get('menu.desktoptoolConfig') ,
			body: $tpl ,
			buttons: [
				$('<button>')
					.text(px.lb.get('ui_label.ok'))
					.addClass('px2-btn')
					.addClass('px2-btn--primary')
					.click(function(){
						px.getDb().commands.php = $tpl.find('[name=php]').val();
						px.getDb().commands.git = $tpl.find('[name=git]').val();
						px.getDb().network.preview.port = $tpl.find('[name=network_preview_port]').val();
						px.getDb().network.preview.accessRestriction = $tpl.find('[name=network_preview_access_restriction]').val();
						px.getDb().network.appserver.port = $tpl.find('[name=network_appserver_port]').val();
						px.getDb().apps.texteditor = $tpl.find('[name=apps_texteditor]').val();
						px.getDb().apps.texteditorForDir = $tpl.find('[name=apps_texteditor_for_dir]').val();
						px.getDb().language = $tpl.find('[name=language]').val();
						px.save(function(){
							px.closeDialog();
						});
					}
				) ,
				$('<button>')
					.text(px.lb.get('ui_label.cancel'))
					.addClass('px2-btn')
					.click(function(){
						px.closeDialog();
					})
			]
		});
	}

})(px, jQuery, window);
