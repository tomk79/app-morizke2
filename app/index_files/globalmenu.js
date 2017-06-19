/**
 * globamenu.js
 *
 * `px.lb` は、多言語対応機能です。
 * `app/common/language/language.csv` にある言語ファイルから、
 * ユーザーが選択した言語コードに対応するテキストを取り出します。
 */
module.exports = function(px){
	var _appName = px.packageJson.window.title;
	var nw = px.nw;
	var $ = px.$;

	var _menu = [];

	_menu.push({
		"label":px.lb.get('menu.home'),
		"cond":"projectSelected",
		"area":"mainmenu",
		"app":"fncs/home/index.html",
		"click": function(){
			px.subapp();
		}
	});
	_menu.push({
		"label":px.lb.get('menu.dashboard'),
		"cond":"projectSelected",
		"area":"shoulder",
		"app":"index.html",
		"click": function(){
			px.deselectProject();
			px.subapp();
		}
	});
	_menu.push({
		"label":px.lb.get('menu.openFolder'),
		"cond":"homeDirExists",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.getCurrentProject().open();
		}
	});
	_menu.push({
		"label":px.lb.get('menu.openInTexteditor'),
		"cond":"homeDirExists",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.openInTextEditor( px.getCurrentProject().get('path') );
		}
	});
	_menu.push({
		"label":px.lb.get('menu.openInTerminal'),
		"cond":"homeDirExists",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.openInTerminal( px.getCurrentProject().get('path') );
		}
	});
	_menu.push({
		"label":px.lb.get('menu.clearcache'),
		"cond":"pxStandby",
		"area":"shoulder",
		"app":"fncs/clearcache/index.html",
		"click": function(){
			px.subapp($(this).data('app'));
		}
	});
	_menu.push({
		"label":px.lb.get('menu.systemInfo'),
		"cond":"always",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.dialog({
				"title": px.lb.get('menu.systemInfo'),
				"body": $('<iframe>').attr('src', 'mods/systeminfo/index.html').css({'width':'100%','height':460})
			});
		}
	});
	_menu.push({
		"label":_appName+" "+px.lb.get('menu.desktoptoolConfig'),
		"cond":"always",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.editPx2DTConfig();
		}
	});
	_menu.push({
		"label":px.lb.get('menu.developerTool'),
		"cond":"always",
		"area":"shoulder",
		"app":null,
		"click": function(){
			// ブラウザの DevTools を開く
			nw.Window.get().showDevTools();
			// FYI: nodeJs の DevTools は スクリプト上から開けない
		}
	});
	_menu.push({
		"label":px.lb.get('menu.exit'),
		"cond":"always",
		"area":"shoulder",
		"app":null,
		"click": function(){
			px.exit();
		}
	});


	/**
	 * グローバルメニューの定義を取得
	 */
	this.getGlobalMenuDefinition = function(){
		return _menu;
	}

	/**
	 * グローバルメニューを描画
	 */
	this.drawGlobalMenu = function($shoulderMenu, _current_app){
		var cpj = px.getCurrentProject();
		var cpj_s = null;
		if( cpj !== null ){
			cpj_s = cpj.status()
		}

		for( var i in _menu ){
			if( _menu[i].cond == 'projectSelected' ){
				if( cpj === null ){
					continue;
				}
			}else if( _menu[i].cond == 'composerJsonExists' ){
				if( cpj === null || !cpj_s.composerJsonExists ){
					continue;
				}
			}else if( _menu[i].cond == 'homeDirExists' ){
				if( cpj === null || !cpj_s.homeDirExists ){
					continue;
				}
			}else if( _menu[i].cond == 'pxStandby' ){
				if( cpj === null || !cpj_s.isPxStandby ){
					continue;
				}
			}else if( _menu[i].cond != 'always' ){
				continue;
			}

			var $tmpMenu = $('<a>')
				.attr({"href":"javascript:;"})
				.on('click', _menu[i].click)
				.text(_menu[i].label)
				.data('app', _menu[i].app)
				.addClass( ( _current_app==_menu[i].app ? 'current' : '' ) )
			;

			switch( _menu[i].area ){
				case 'shoulder':
					$shoulderMenu.find('ul').append( $('<li>')
						.append( $tmpMenu )
					);
					break;
				default:
					$('.theme-header__gmenu ul').append( $('<li>')
						.append( $tmpMenu )
					);
					break;
			}
		}
		return;
	}

}
