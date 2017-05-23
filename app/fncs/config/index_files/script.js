window.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }

	var _this = this;

	var pj = px.getCurrentProject();
	var configBasePath = pj.get('path')+'/'+pj.get('home_dir');
	var confPath = configBasePath;
	var CodeMirrorInstans = [];

	function cont_init(cb){
		cb = cb||function(){};

		var $tpl = $( $('#template-main').html() );
		$('.contents').html('').append( $tpl );

		// $('.cont_config_json_preview pre').text( JSON.stringify( pj.getConfig() ) );
		// $('.cont_px2dtconfig_json_preview pre').text( JSON.stringify( pj.getPx2DTConfig() ) );

		var src = '';
		if( px.utils.isFile(configBasePath+'/config.json') ){
			confPath = configBasePath+'/config.json';
		}else if( px.utils.isFile(configBasePath+'/config.php') ){
			confPath = configBasePath+'/config.php';
		}
		src = px.fs.readFileSync(confPath);
		$('.cont_config_edit').html('').append( $('<textarea>').val(src) );
		CodeMirrorInstans['px2config'] = window.textEditor.attachTextEditor(
			$('.cont_config_edit textarea').get(0),
			'php',
			{
				save: function(){ window.contApp.save(); }
			}
		);

		windowResize();
		$(window).resize(function(){
			windowResize();
		});
		cb();
	}
	this.save = function( btn ){
		if(btn){ $(btn).attr('disabled', 'disabled'); }

		var src = $('.cont_config_edit textarea').val();
		src = JSON.parse( JSON.stringify( src ) );

		px.fs.writeFile( confPath, src, {}, function(err){
			pj.updateConfig(function(){
				cont_init(function(){
					if(btn){ $(btn).removeAttr('disabled'); }
					px.message( 'コンフィグを保存しました。' );
				});
			});
		} );
	}

	function windowResize(){
		$('.CodeMirror')
			.css({
				'height':$(window).height() - $('.container').outerHeight() - $('.cont_btn_save').parent().outerHeight() - 10
			})
		;
	}

	$(function(){
		cont_init();
	});

})( window.parent.px );
