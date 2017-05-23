window.px = window.parent.px;

var pj = px.getCurrentProject();
var cont_pathComposerJson = pj.get('path')+'composer.json';
var CodeMirrorInstans;
if( px.utils.isDirectory( pj.get_realpath_composer_root() ) ){
	cont_pathComposerJson = pj.get_realpath_composer_root()+'composer.json';
}

function cont_init(){
	// bootstrap
	$('*').tooltip();

	px.fs.readFile(cont_pathComposerJson, function(err, src){
		if(err){
			px.message(err);
		}
		$('.cont_edit_composer_json textarea').val(src);

		$('a.cont_edit[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			// console.log( e.target ); // newly activated tab
			// console.log( e.relatedTarget ); // previous active tab
			if( !CodeMirrorInstans ){
				CodeMirrorInstans = window.textEditor.attachTextEditor(
					$('.cont_edit_composer_json textarea').get(0),
					'json',
					{
						save: function(){ cont_save_composerJson(); }
					}
				);
			}
			cont_resizeEvent();

		});

		$(window).resize(cont_resizeEvent);
		cont_resizeEvent();
	});


}

function cont_selfupdate_conposer(btn){
	$(btn).attr('disabled', 'disabled');
	$('#cont_maintenance .cont_console').html('');

	pj.execComposer(
		[
			'self-update'
		] ,
		{
			success: function(data){
				$('#cont_maintenance .cont_console').text(
					$('#cont_maintenance .cont_console').text() + data
				);
			} ,
			error: function(data){
				$('#cont_maintenance .cont_console').text(
					$('#cont_maintenance .cont_console').text() + data
				);
			} ,
			complete: function(data, error, code){
				// $('.cont_console').text(
				// 	$('.cont_console').text() + code
				// );
				$(btn).removeAttr('disabled');
				px.message( 'composer self-update 完了しました。' );
			}
		}
	);
}

function cont_update_proj(btn){
	$(btn).attr('disabled', 'disabled');
	$('#cont_update .cont_console').html('');
	pj.execComposer(
		['update'],
		{
			success: function(data){
				$('#cont_update .cont_console').text(
					$('#cont_update .cont_console').text() + data
				);
			} ,
			error: function(data){
				$('#cont_update .cont_console').text(
					$('#cont_update .cont_console').text() + data
				);
			} ,
			complete: function(data, error, code){
				// $('.cont_console').text(
				// 	$('.cont_console').text() + code
				// );
				$(btn).removeAttr('disabled');
				px.composerUpdateChecker.clearStatus( pj, function(){
					px.message( 'composer update 完了しました。' );
				} );
			}
		}
	);
}

function cont_install_proj(btn){
	$(btn).attr('disabled', 'disabled');
	$('#cont_status .cont_console').html('');

	pj.execComposer(
		['install'],
		{
			success: function(data){
				$('#cont_status .cont_console').text(
					$('#cont_status .cont_console').text() + data
				);
			} ,
			error: function(data){
				$('#cont_status .cont_console').text(
					$('#cont_status .cont_console').text() + data
				);
			} ,
			complete: function(data, error, code){
				$(btn).removeAttr('disabled');
				px.message( 'composer install 完了しました。' );
			}
		}
	);
}

function cont_show_packages(btn, opt){
	$(btn).attr('disabled', 'disabled');
	$('#cont_status .cont_console').html('');

	pj.execComposer(
		['show', opt],
		{
			success: function(data){
				$('#cont_status .cont_console').text(
					$('#cont_status .cont_console').text() + data
				);
			} ,
			error: function(data){
				$('#cont_status .cont_console').text(
					$('#cont_status .cont_console').text() + data
				);
			} ,
			complete: function(data, error, code){
				$(btn).removeAttr('disabled');
				px.message( 'composer show 完了しました。' );
			}
		}
	);
}

/**
 * composer.json の編集を保存
 */
function cont_save_composerJson(form){
	var $form = $('form.cont_edit_composer_json');
	var src = $form.find('textarea').val();

	src = JSON.parse( JSON.stringify( src ) );
	px.fs.writeFile( cont_pathComposerJson, src, {encoding:'utf8'}, function(err){
		if(err){
			px.message( 'composer.json の保存に失敗しました。' );
		}else{
			px.message( 'composer.json を保存しました。 $ composer update を実行してください。' );
		}
	} );
}

/**
 * window resize
 */
function cont_resizeEvent(){
	var cmHeight = $(window).innerHeight() - $('#cont_edit button').offset().top - $('#cont_edit button').outerHeight() -20;
	if( cmHeight < 120 ){ cmHeight = 'auto'; }
	$('.cont_edit_composer_json .CodeMirror')
		.css({
			'height': cmHeight
		})
	;
}

$(function(){
	cont_init();
});
