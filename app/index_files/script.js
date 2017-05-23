/**
 * プロジェクト設定を追加する
 */
function cont_createProject(form){
	var pj = {};
	pj.name = $(form).find('[name=pj_name]').val();
	pj.path = $(form).find('[name=pj_path]').val();
	pj.home_dir = $(form).find('[name=pj_home_dir]').val();
	pj.entry_script = $(form).find('[name=pj_entry_script]').val();
	// pj.vcs = $(form).find('[name=pj_vcs]').val();

	var _fs = require('fs');
	if( !px.utils.isDirectory(pj.path) ){
		alert('存在するディレクトリを選択してください。');
		return false;
	}

	if( pj.path.match(new RegExp('[^a-zA-Z0-9\\/\\-\\_\\.\\@\\:\\;\\\\]')) ){
		if(!confirm('[注意] マルチバイト文字を含むパスでは、正常に動作しない場合があります。アルファベットのみで構成されたパスにセットアップすることを強くお勧めします。続けますか？')){
			return false;
		}
	}

	// プロジェクトを追加
	px.createProject(
		pj ,
		{
			error:function(errorMsg){
				alert('エラー: 入力不備があります。');
				for( var i in errorMsg ){
					alert(errorMsg[i]);
				}
			},
			success: function(){
				alert('プロジェクトを追加しました。');
				px.subapp();
			}
		}
	);
	return true;
}
