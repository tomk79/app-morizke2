(function(px, $){
	var $dialog;

	/**
	 * ダイアログを表示する
	 */
	px.dialog = function(opt){
		px.closeDialog();

		opt = opt||{};
		opt.title = opt.title||'command:';
		opt.body = opt.body||$('<div>');
		opt.buttons = opt.buttons||[
			$('<button class="px2-btn px2-btn--primary">').text('OK').click(function(){
				px.closeDialog();
			})
		];

		for( var i in opt.buttons ){
			var $btnElm = $(opt.buttons[i]);
			$btnElm.each(function(){
				if(!$(this).hasClass('btn') && !$(this).hasClass('px2-btn')){
					$(this).addClass('px2-btn');
				}
			});
			opt.buttons[i] = $btnElm;
		}

		var $dialogButtons = $('<div class="dialog-buttons center">').append(opt.buttons);

		$dialog = $('<div>')
			.addClass('contents')
			.css({
				'position':'fixed',
				'left':0, 'top':0,
				'width': $(window).width(),
				'height': $(window).height(),
				'overflow':'hidden',
				'z-index':10000
			})
			.append( $('<div>')
				.css({
					'position':'fixed',
					'left':0, 'top':0,
					'width':'100%', 'height':'100%',
					'overflow':'hidden',
					'background':'#000',
					'opacity':0.5
				})
			)
			.append( $('<div>')
				.css({
					'position':'absolute',
					'left':0, 'top':0,
					'padding-top':'4em',
					'overflow':'auto',
					'width':"100%",
					'height':"100%"
				})
				.append( $('<div>')
					.addClass('dialog_box')
					.css({
						'width':'80%',
						'margin':'3em auto'
					})
					.append( $('<h1>')
						.text(opt.title)
					)
					.append( $('<div>')
						.append(opt.body)
					)
					.append( $dialogButtons )
				)
			)
		;

		$('body')
			.append($dialog)
		;
		$('body *')
			.attr({
				'tabindex': '-1'
			})
		;
		$dialog.find('*')
			.removeAttr('tabindex')
		;
		return $dialog;
	}//dialog()

	/**
	 * ダイアログを閉じる
	 */
	px.closeDialog = function(){
		if( $dialog ){
			$dialog.remove();
			$('*')
				.removeAttr('tabindex')
			;
		}
		return $dialog;
	}//closeDialog()

	/**
	 * ダイアログ上でコマンドを流す
	 */
	px.execDialog = function(cmd, opt){
		var $dialog;
		var output = '';
		var dlgOpt = {};

		opt = opt||{};
		opt.title = opt.title||'command:';
		opt.description = opt.description||'';
		opt.cmdComplete = opt.cmdComplete||function(){};
		opt.complete = opt.complete||function(){};

		var $preCont = $('<div>');
		var $pre = $('<pre>')
			.css({
				'height':'12em',
				'overflow':'auto'
			})
			.append( $preCont
				.addClass('selectable')
				.text('実行中...')
			)
		;

		dlgOpt = {};
		dlgOpt.title = opt.title;
		dlgOpt.body = $('<div>')
			.append(opt.description)
			.append( $pre )
		;
		dlgOpt.buttons = [
			$('<button>')
				.text('OK')
				.click(function(){
					opt.complete( output );
					px.closeDialog();
					// $dialog.remove();
				})
		];

		$dialog = px.dialog( dlgOpt );

		output = '';
		px.progress.start({});
		px.utils.exec(
			cmd,
			function(error, stdout, stderr){
				px.progress.close();
				opt.cmdComplete();
				output = stdout;
				$preCont.text(stdout);
				dlgOpt.buttons[0].removeAttr('disabled').focus();
			} ,
			{
				cd: opt.cd
			}
		);
		return this;
	}//execDialog()

	/**
	 * ダイアログ上でコマンドを流す(spawn)
	 */
	px.spawnDialog = function(cmd, cliOpts, opt){
		var $dialog;
		var stdout = '';

		cmd = px.cmd(cmd);
		opt = opt||{};
		opt.title = opt.title||'command:';
		opt.description = opt.description||$('<div>');
		opt.success = opt.success||function(){};
		opt.error = opt.error||function(){};
		opt.cmdComplete = opt.cmdComplete||function(){};
		opt.complete = opt.complete||function(){};

		var $preCont = $('<div>');
		var $pre = $('<pre>')
			.css({
				'height':'12em',
				'overflow':'auto'
			})
			.append( $preCont
				.addClass('selectable')
				.text('実行中...')
			)
		;

		var dlgOpt = {};
		dlgOpt.title = opt.title;
		dlgOpt.body = $('<div>')
			.append( opt.description )
			.append( $pre )
		;
		dlgOpt.buttons = [
			$('<button>')
				.text('OK')
				.click(function(){
					opt.complete(stdout);
					px.closeDialog();
					// $dialog.remove();
				})
				.attr({'disabled':'disabled'})
		];

		$dialog = this.dialog( dlgOpt );

		stdout = '';
		px.progress.start({});
		this.utils.spawn(
			cmd,
			cliOpts,
			{
				cd: opt.cd,
				success: function(data){
					stdout += data;
					$preCont.text(stdout);
					// console.log( $preCont.height() );
					$pre.scrollTop( $preCont.height() - $pre.height() );
					opt.success(data);
				} ,
				error: function(data){
					stdout += data;
					$preCont.text(stdout);
					// console.log( $preCont.height() );
					$pre.scrollTop( $preCont.height() - $pre.height() );
					opt.error(data);
				} ,
				complete: function(code){
					px.progress.close();
					opt.cmdComplete(code);
					dlgOpt.buttons[0].removeAttr('disabled').focus();
				}
			}
		);
		return this;
	}//spawnDialog()

	/**
	 * イベントリスナー
	 */
	$(window).on( 'resize', function(e){
		if( typeof($dialog) !== typeof( $('<div>') ) ){return;}
		$dialog
			.css({
				'width': $(window).width(),
				'height': $(window).height()
			})
		;
	} );

})(px, jQuery);
