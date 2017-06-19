window.px = window.parent.px;
window.contApp = new (function(){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var status = pj.status();

	/**
	 * installer collection
	 */
	this.installer = {};

	/**
	 * initialize
	 */
	function init(){
		var px2dtLDA_pj = px.px2dtLDA.project(pj.projectId);

		px.utils.iterateFnc([
			function(it, arg){
				$('.tpl_name').text( pj.get('name') );
				$('.tpl_path').text( pj.get('path') );
				$('.tpl_home_dir').text( pj.get('home_dir') );
				$('.tpl_entry_script').text( pj.get('entry_script') );
				$('.tpl_external_preview_server_origin').text( px2dtLDA_pj.getExtendedData('external_preview_server_origin')||'' );
				$('address.center').text( px.packageJson.pickles2.credit );
				it.next(arg);
			} ,
			function(it, arg){
				var statusTable = px.utils.bindEjs( $('#template-status-table').html(), {'status': status} );
				$('.tpl_status_table').html( statusTable );
				it.next(arg);
			} ,
			function(it, arg){
				var $mainTaskUi = $('.cont_maintask_ui');

				var isPathEmptyDir = (function(isDir, path){
					if(!isDir){return false;}
					var ls = px.fs.readdirSync(path);
					// console.log(ls);
					// console.log(ls.length);
					var rtn = !ls.length;
					// console.log(rtn);
					return rtn;
				})(status.pathExists, pj.get('path'));


				if( !status.pathExists ){
					// パスの選択しなおし
					$mainTaskUi
						.html( $('#template-reselectProject-path').html() )
						.find('form')
							.on('submit', function(){
								_this.selectProjectPath( $(this).find('[name=pj_path]').val() );
								return false;
							})
					;
				}else if( status.pathContainsFileCount && !status.entryScriptExists ){
					// EntryScript が存在しない。
					$mainTaskUi
						.html( $('#template-reselectProject-entryScript').html() )
						.find('form')
							.on('submit', function(){
								_this.editProject();
								return false;
							})
					;
				}else if( status.pathExists && !status.composerJsonExists && !isPathEmptyDir ){
					// ディレクトリが空ではないためセットアップできない画面
					$mainTaskUi
						.html( $('#template-is-not-empty-dir').html() )
						.find('form')
							.on('submit', function(){
								_this.selectProjectPath( $(this).find('[name=pj_path]').val() );
								return false;
							})
					;
				}else if( status.pathExists && !status.composerJsonExists ){
					// インストールボタン
					$mainTaskUi
						.html( $('#template-install-pickles2').html() )
						.find('form')
							.on('submit', function(){
								install(this);
								return false;
							})
					;
				}else if( status.pathExists && !status.vendorDirExists ){
					// `composer install` ボタン
					$mainTaskUi
						.html( $('#template-install-composer').html() )
					;
				}else if( !status.isPxStandby || !status.pathExists || !status.confFileExists ){
					// 何らかのエラーがある可能性があります
					$mainTaskUi
						.html( $('#template-conf-not-exists').html() )
					;
				}else{
					// ちゃんとインストールできてます
					$mainTaskUi
						.html( $('#template-standby').html() )
					;
				}

				var errors = pj.getErrors();
				if( errors.length ){
					var $errors = $('<div class="selectable">');
					for( var idx in errors ){
						$errors.append( $('<pre>').append( $('<code>').text( errors[idx].message ) ) );
					}
					$mainTaskUi.append( $errors );
				}

				it.next(arg);
				return;
			} ,
			function(it, arg){
				// README.md を表示する
				var readmePath = pj.get('path');
				if( status.gitDirExists ){
					readmePath = pj.get_realpath_git_root();
				}
				var htmlSrc = '<p class="cont_readme_content-no_readme">--- NO README.md ---</p>';
				if( px.utils.isDirectory(readmePath) ){
					var filenames = ['README.md','readme.md','README.html','readme.html','README.txt','readme.txt'];
					for( var idx in filenames ){
						if( px.utils.isFile(readmePath+'/'+filenames[idx]) ){
							var ext = px.utils.getExtension(filenames[idx]);
							switch(ext){
								case 'md':
									htmlSrc = px.fs.readFileSync( readmePath+'/'+filenames[idx] );
									htmlSrc = htmlSrc.toString();
									htmlSrc = px.utils.markdown(htmlSrc);
									break;
								case 'html':
									htmlSrc = px.fs.readFileSync( readmePath+'/'+filenames[idx] );
									htmlSrc = htmlSrc.toString();
									break;
								case 'txt':
								default:
									htmlSrc = px.fs.readFileSync( readmePath+'/'+filenames[idx] );
									htmlSrc = htmlSrc.toString();
									htmlSrc = $('<div>').text(htmlSrc).html();
									htmlSrc = htmlSrc.replace(/\r\n|\r|\n/g, '<br />');
									break;
							}
							break;
						}
					}
				}

				$('.cont_readme_content')
					.html('')
					.append( htmlSrc )
					.find('a').each(function(){
						$(this).on('click', function(){
							px.utils.openURL( $(this).attr('href') );
							return false;
						});
					})
				;

				it.next(arg);
			}
		]).start({});

	}// init()

	/**
	 * パスの選び直し
	 */
	this.selectProjectPath = function(path){
		var pj = px.getCurrentProject();
		pj.projectInfo.path = path;
		if( !px.updateProject(pj.projectId, pj.projectInfo) ){
			var msg = 'ERROR: FAILED to update project info.';
			console.error(msg);
			alert(msg);
			return false;
		}
		px.save(function(){
			px.subapp();
		});
		return true;
	}

	/**
	 * Pickles2 クリーンインストール
	 */
	function install(form){
		var btn = $(form).find('button');
		$(btn).attr('disabled','disabled');

		var method = $(form).find('input[name=setup_method]:checked').val();
		var param = {};
		switch(method){
			case 'git':
				param.repositoryUrl = $(form).find('input[name=git_url_repository]').val();
				break;
		}

		_this.installer[method].install( pj, param, {
			complete: function(){
				$(btn).removeAttr('disabled');
				var currentPjId = pj.projectId;
				px.deselectProject();
				px.selectProject( currentPjId, function(){
					px.subapp();
				} );
			}
		} );
	}

	/**
	 * プロジェクトを編集する
	 */
	this.editProject = function(){
		var $form = $( $('#template-form-editProject').html() );
		var px2dtLDA_pj = px.px2dtLDA.project(pj.projectId);
		$form.find('[name=pj_name]').val(px2dtLDA_pj.getName());
		// $form.find('[name=pj_path]').val(pj.get('path'));//←セットできない！
		$form.find('[name=pj_home_dir]').val(px2dtLDA_pj.get().home_dir);
		$form.find('[name=pj_entry_script]').val(px2dtLDA_pj.getEntryScript());
		$form.find('[name=pj_external_preview_server_origin]').val(px2dtLDA_pj.getExtendedData('external_preview_server_origin'));

		px.dialog( {
			title: 'プロジェクト情報を編集',
			body: $form ,
			buttons: [
				$('<button>')
					.text('OK')
					.addClass('px2-btn--primary')
					.on('click', function(){
						var data = px2dtLDA_pj.get();
						data.home_dir = $form.find('[name=pj_home_dir]').val()
						px2dtLDA_pj.setName($form.find('[name=pj_name]').val());
						px2dtLDA_pj.setEntryScript($form.find('[name=pj_entry_script]').val());
						var external_preview_server_origin = $form.find('[name=pj_external_preview_server_origin]').val();
						px2dtLDA_pj.setExtendedData('external_preview_server_origin', (external_preview_server_origin || undefined));
						if( $form.find('[name=pj_path]').val().length ){
							px2dtLDA_pj.setPath($form.find('[name=pj_path]').val());
						}

						px.save(function(){
							px.closeDialog();
							px.message('プロジェクト情報を更新しました。');
							px.subapp();
						});
					} ) ,
				$('<button>')
					.text('Cancel')
					.on('click', function(){
						px.closeDialog();
					} )
			]
		} );
	}

	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})();
