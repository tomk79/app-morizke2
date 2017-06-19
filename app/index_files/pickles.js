new (function($, window){
	// pickles
	window.px = _this = this;

	// node.js
	this.process = process;

	// NW.js
	this.nw = nw;
	this.nwWindow = nw.Window.get();

	// jQuery
	this.$ = $;

	// Underscore
	this._ = _;

	// package.json
	var _packageJson = require('../package.json');
	this.packageJson = _packageJson;

	// data
	var _path_data_dir = (process.env.HOME||process.env.LOCALAPPDATA) + '/'+_packageJson.pickles2.dataDirName+'/';

	/**
	 * Pickles 2 のバージョン情報を取得する。
	 *
	 * バージョン番号発行の規則は、 Semantic Versioning 2.0.0 仕様に従います。
	 * - [Semantic Versioning(英語原文)](http://semver.org/)
	 * - [セマンティック バージョニング(日本語)](http://semver.org/lang/ja/)
	 *
	 * *[ナイトリービルド]*<br />
	 * バージョン番号が振られていない、開発途中のリビジョンを、ナイトリービルドと呼びます。<br />
	 * ナイトリービルドの場合、バージョン番号は、次のリリースが予定されているバージョン番号に、
	 * ビルドメタデータ `+nb` を付加します。
	 * 通常は、プレリリース記号 `alpha` または `beta` を伴うようにします。
	 * - 例：1.0.0-beta.12+nb (=1.0.0-beta.12リリース前のナイトリービルド)
	 *
	 * @return string バージョン番号を示す文字列
	 */
	this.getVersion = function(){
		return _packageJson.version;
	}

	// utils
	var _utils79 = require('utils79');
	this.utils79 = _utils79;
	var _utils = require('./index_files/_utils.node.js');
	this.utils = _utils;

	// filesystem
	var _fs = require('fs');
	this.fs = _fs;
	var _fsEx = require('fs-extra');
	this.fsEx = _fsEx;
	var _path = require('path');
	this.path = _path;
	// var _git = require('nodegit');
	// this.git = _git;
	var _mkdirp = require('mkdirp');
	this.mkdirp = _mkdirp;
	var _glob = require('glob');
	this.glob = _glob;
	var _SearchInDir = require('node-search-in-directory');
	this.SearchInDir = _SearchInDir;

	// versioning
	var _semver = require('semver');
	this.semver = _semver;

	// template engines
	var _twig = require('twig');
	this.twig = _twig;
	var _ejs = require('ejs');
	this.ejs = _ejs;

	// Pickles 2
	var _px2agent = require('px2agent');
	this.px2agent = _px2agent;
	var _px2dtLDA = new (require('px2dt-localdata-access'))(_path_data_dir);
	this.px2dtLDA = _px2dtLDA;

	// DOM Parser for NodeJS
	var _cheerio = require('cheerio');
	this.cheerio = _cheerio;

	// Keyboard Util
	var _Keypress = {};
	this.Keypress = _Keypress;

	var _platform = (function(){
		var platform = 'unknown';
		console.log('platform:', process.platform);
		if(process.platform == 'win32')return 'win';
		if(process.platform == 'darwin')return 'mac';
		if(process.platform == 'linux')return 'linux';
		console.log('unknown platform:', process.platform);
		return platform;
	})();
	console.log('platform: '+_platform);
	var _current_app = null;
	var _selectedProject = null;
	var _pj = null;

	var _php = require('phpjs');
	this.php = _php;

	var _it79 = require('iterate79');
	this.it79 = _it79;

	var _nw_gui = require('nw.gui');
	var _appName = _packageJson.window.title;
	window.document.title = _appName;

	this.progress = new require('./index_files/pickles.progress.js').init(this, $);

	this.textEditor = window.textEditor;

	this.nodePhpBin = {};//init内で初期化される

	var $header, $footer, $main, $contents, $shoulderMenu;
	var _menu = [];

	/**
	 * アプリケーションの初期化
	 */
	function init(callback){
		_it79.fnc({},
			[
				function(it1, data){
					// データディレクトリを初期化
					px.px2dtLDA.initDataDir(function(result){
						if( !result ){
							console.error('FAILED to Initialize data directory. - '+_path_data_dir);
						}
						px.px2dtLDA.db.commands.php = px.px2dtLDA.db.commands.php || '';
						px.px2dtLDA.db.commands.git = px.px2dtLDA.db.commands.git || '';
						px.px2dtLDA.db.language = px.px2dtLDA.db.language || 'ja';
						px.px2dtLDA.db.apps.texteditor = px.px2dtLDA.db.apps.texteditor || '';
						px.px2dtLDA.db.apps.texteditorForDir = px.px2dtLDA.db.apps.texteditorForDir || '';
						px.px2dtLDA.db.network.preview = px.px2dtLDA.db.network.preview || {};
						px.px2dtLDA.db.network.preview.port = px.px2dtLDA.db.network.preview.port || _packageJson.pickles2.network.preview.port;
						px.px2dtLDA.db.network.preview.accessRestriction = px.px2dtLDA.db.network.preview.accessRestriction || "loopback";
						px.px2dtLDA.db.network.appserver = px.px2dtLDA.db.network.appserver || {};
						px.px2dtLDA.db.network.appserver.port = px.px2dtLDA.db.network.appserver.port || _packageJson.pickles2.network.appserver.port;

						px.px2dtLDA.save(function(){
							it1.next(data);
						});
					});
				},
				function(it1, data){
					(function(){
						// node-webkit の標準的なメニューを出す
						var win = _nw_gui.Window.get();
						var nativeMenuBar = new _nw_gui.Menu({ type: "menubar" });
						try {
							nativeMenuBar.createMacBuiltin( _appName );
							win.menu = nativeMenuBar;
							// win.menu.append(new _nw_gui.MenuItem({
							// 	type: "normal",
							// 	label: 'Item 1',
							// 	click: function() {
							// 		console.log('Click on Item 1');
							// 	}
							// }));
						} catch (ex) {
							console.log(ex.message);
						}

						// ↓Macのメニューバーの右側に並ぶメニューのこと
						// var tray = new _nw_gui.Tray({ icon: './common/images/appicon.png' });
						// tray.title = 'Love Tray';
						// tray.tooltip = 'Love Tooltip';

					})();

					px.log( 'Application start;' );
					it1.next();
					return;
				},
				function(it1, data){
					// 各国語言語切替機能のロード
					var LangBank = require('langbank');
					px.lb = new LangBank( require('path').resolve('./app/common/language/language.csv'), function(){
						px.lb.setLang(px.px2dtLDA.getLanguage());
						// console.log(px.lb.get('welcome'));
						it1.next();
					}); // new LangBank()
					return;
				},
				function(it1, data){
					// ヒント機能のロード
					var Px2Hint = require('./index_files/pickles.hint.js');
					px.hint = new Px2Hint( px, require('path').resolve('./app/common/language/hint.csv'), function(){
						px.hint.setLang(px.px2dtLDA.getLanguage());
						it1.next();
					}); // new LangBank()
					return;
				},
				function(it1, data){
					// file watcher
					var FileWatcher = require('./index_files/pickles.watcher.js');
					px.watcher = new FileWatcher( px );
					it1.next();
					return;
				},
				function(it1, data){
					// db.json の読み込み
					px.load(function(){
						it1.next();
						return;
					}); // px.load()
					return;
				},
				function(it1, data){
					var ComposerUpdateChecker = require('./index_files/pickles.composerUpdateChecker.js');
					px.composerUpdateChecker = new ComposerUpdateChecker( px, function(){
						it1.next();
					});
					return;
				},
				function(it1, data){
					// CSS拡張
					$('head').append( $('<style>')
						.html(
							'.theme_gmenu ul li a:hover,'
							+'.theme_gmenu ul li a.current{color: '+_packageJson.pickles2.colors.defaultKeyColor+';}'
							+'.theme_shoulder_menu button {border-left: 1px solid '+_packageJson.pickles2.colors.defaultKeyColor+';}'
							+'.theme_shoulder_menu ul li a.current {background-color: '+_packageJson.pickles2.colors.defaultKeyColor+';}'
						)
					);
					it1.next();
					return;
				},
				function(it1, data){
					// setup "node-php-bin"
					px.NodePhpBin = require('node-php-bin');
					px.nodePhpBinOptions = {};
					if( px.px2dtLDA.db.commands && px.px2dtLDA.db.commands['php'] ){
						px.nodePhpBinOptions = {
							'bin': px.px2dtLDA.db.commands['php'] ,
							'ini': null
						};
					}
					px.nodePhpBin = px.NodePhpBin.get(px.nodePhpBinOptions);
					it1.next();
					return;
				},
				function(it1, data){
					// メニュー設定
					var gmenu = require('./index_files/globalmenu.js');
					_menu = new gmenu(px);
					it1.next(data);
				},
				function(it1, data){
					// 開発者のための隠しコマンド
					// Ctrl + Opt + R で トップフレームを再読込する
					$(window).on('keypress', function(e){
						// console.log(e);
						if(e.keyCode == 18 && e.ctrlKey && e.altKey ){
							window.location.href='./index.html';
						}
					});
					it1.next(data);
				},
				function(it1, data){
					callback();
				}

			]
		);
		return;
	}

	/**
	 * DBをロードする
	 */
	this.load = function(callback){
		callback = callback || function(){};
		// db.json の読み込み・初期化
		px.px2dtLDA.load(function(){
			callback();
		})
		return;
	}

	/**
	 * DBを保存する
	 */
	this.save = function(callback){
		callback = callback || function(){};
		px.px2dtLDA.save(function(){
			callback();
		});
		return;
	}

	/**
	 * プラットフォーム名を得る。
	 * Pickles 2 が動作しているPCのOS名。
	 */
	this.getPlatform = function(){
		return _platform;
	}

	/**
	 * ローカルのデータディレクトリのパスを得る。
	 */
	this.getDataDir = function(){
		return _path_data_dir;
	}

	/**
	 * ローカルのデータディレクトリを開く
	 */
	this.openDataDir = function(){
		return px.utils.openURL( _path_data_dir );
	}

	/**
	 * プロジェクト一覧を取得する
	 */
	this.getProjectList = function(callback){
		callback = callback || function(){};
		var projects = this.px2dtLDA.getProjectAll();
		// var rtn = px.px2dtLDA.db.projects;
		callback(projects);
		return;
	}

	/**
	 * プロジェクトを追加する
	 */
	this.createProject = function(projectInfo, opt){
		projectInfo = projectInfo||{};
		opt = opt||{};
		opt.success = opt.success||function(){};
		opt.error = opt.error||function(){};
		opt.complete = opt.complete||function(){};

		if( typeof(projectInfo.home_dir) != typeof('') || !projectInfo.home_dir.length ){
			projectInfo.home_dir = 'px-files/'
		}
		if( typeof(projectInfo.entry_script) != typeof('') || !projectInfo.entry_script.length ){
			projectInfo.entry_script = '.px_execute.php'
		}

		var isError = false;
		var errorMsg = {};

		if( typeof(projectInfo.name) != typeof('') || !projectInfo.name.length ){
			errorMsg.name = 'name is required.';
			isError = true;
		}
		if( typeof(projectInfo.path) != typeof('') || !projectInfo.path.length ){
			errorMsg.path = 'path is required.';
			isError = true;
		}else if( !px.fs.existsSync(projectInfo.path) ){
			errorMsg.path = 'path is required as a existed directory path.';
			isError = true;
		}
		if( typeof(projectInfo.home_dir) != typeof('') || !projectInfo.home_dir.length ){
			errorMsg.home_dir = 'home directory is required.';
			isError = true;
		}
		if( typeof(projectInfo.entry_script) != typeof('') || !projectInfo.entry_script.length ){
			errorMsg.entry_script = 'entry_script is required.';
			isError = true;
		}
		if( isError ){
			opt.error(errorMsg);
			opt.complete();
			return false;
		}

		var result = px.px2dtLDA.addProject( projectInfo );
		if( !result ){
			opt.error({'common': 'Unknown ERROR'});
			opt.complete();
			return false;
		}
		px.save(function(){
			opt.success();
			opt.complete();
		});

		return true;
	}

	/**
	 * プロジェクト情報を更新する
	 */
	this.updateProject = function(projectId, projectInfo){
		if( typeof(projectId) !== typeof(0) ){
			return false;
		}
		projectInfo = JSON.parse( JSON.stringify( projectInfo ) );
		px.px2dtLDA.db.projects[projectId] = projectInfo;
		return true;
	}

	/**
	 * プロジェクトを削除する
	 */
	this.deleteProject = function(projectId, callback){
		callback = callback || function(){};
		var result = px.px2dtLDA.removeProject( projectId );
		this.deselectProject();
		this.save(function(){
			callback();
		});
		return true;
	}

	/**
	 * プロジェクトを選択する
	 */
	this.selectProject = function( num, callback ){
		callback = callback||function(){}
		if( typeof(num) != typeof(0) ){
			px.log( '[ERROR] FAILED to selectProject(' + typeof(num) + ')' );
			return false;
		}
		_selectedProject = num;

		px.log( 'selectProject(' + num + ')' );
		this.loadProject(function(){
			px.log( 'project "' + _pj.get('name') + '" is loaded.' );
			callback();
		});
		return true;
	}

	/**
	 * 選択されたプロジェクトをロードする
	 */
	this.loadProject = function( callback ){
		callback = callback||function(){}
		if( typeof(_selectedProject) != typeof(0) ){
			px.log( '[ERROR] FAILED to selectProject(' + typeof(num) + ')' );
			return false;
		}

		// ファイル監視の停止
		px.watcher.stop();

		// alert(num);
		_pj = new (require('./index_files/pickles.project.js'))(
			window,
			this,
			px.px2dtLDA.db.projects[_selectedProject],
			_selectedProject,
			function(){
				// ファイル監視を開始
				px.watcher.start(_pj);

				console.log( 'project "' + _pj.get('name') + '" is reloaded.' );
				callback();
			}
		);
		return true;
	}

	/**
	 * プロジェクトの選択を解除する
	 */
	this.deselectProject = function(){
		px.watcher.stop(); // ファイル監視の停止
		_selectedProject = null;
		_pj = null;
		return true;
	}

	/**
	 * 選択中のプロジェクトの情報を得る
	 */
	this.getCurrentProject = function(){
		if( _selectedProject === null ){
			return null;
		}
		return _pj;
	}

	/**
	 * コマンドのパスを取得する
	 */
	this.cmd = function(cmd){
		if( cmd == 'composer' ){
			return _path_data_dir+'commands/composer/composer.phar';
		}
		if( cmd == 'open' ){
			if(_platform=='win'){
				return 'explorer';
			}
			if(_platform=='linux'){
				return 'xdg-open';
			}
		}
		if( px.px2dtLDA.db.commands && px.px2dtLDA.db.commands[cmd] ){
			return px.px2dtLDA.db.commands[cmd];
		}
		if( cmd == 'php' ){
			return require('node-php-bin').get().getPath();
		}
		return cmd;
	}

	/**
	 * composerを実行する
	 * node-php-bin の PHP などを考慮して、
	 * -c, -d オプションの解決を自動的にやっている前提で、
	 * composer コマンドを実行します。
	 * @param  {[type]} cmd  [description]
	 * @param  {[type]} opts [description]
	 * @return {[type]}      [description]
	 */
	this.execComposer = function( cmd, opts ){
		opts = opts||{};
		opts.success = opts.success||function(){};
		opts.error = opts.error||function(){};
		opts.complete = opts.complete||function(){};
		if( typeof(cmd) == typeof('') ){
			cmd = [cmd];
		}
		cmd.unshift(px.cmd('composer'));
		px.nodePhpBin.script(
			cmd ,
			{
				'cwd': opts.cwd
			} ,
			{
				'success': opts.success,
				'error': opts.error,
				'complete': opts.complete
			}
		);
		return this;
	}

	/**
	 * DBデータまるごと取得
	 */
	this.getDb = function(){
		return px.px2dtLDA.getData();
	}

	/**
	 * ヘルプページを開く
	 */
	this.openHelp = function(){
		px.utils.openURL( 'http://pickles2.pxt.jp/manual/' );
		return;
	}

	/**
	 * 外部テキストエディタで開く
	 */
	this.openInTextEditor = function( path ){
		var pathEditor = '';
		var targetType = null;
		if( this.utils.isDirectory(path) ){
			targetType = 'dir';
			pathEditor = this.getDb().apps.texteditorForDir;
		}else if( px.utils.isFile(path) ){
			targetType = 'file';
			pathEditor = this.getDb().apps.texteditor;
		}else{
			alert('編集対象のパスが存在しません。'+"\n"+path);
			console.error('ERROR: '+'編集対象のパスが存在しません。'+"\n"+path);
			return false;
		}

		var msgSudgestSetting = _appName+'設定 メニューから、アプリケーション "外部テキストエディタ'+(targetType=='dir'?'(ディレクトリを開く)':'')+'" を設定してください。';
		if( !this.getDb().apps || ( !pathEditor.length && !this.utils.isDirectory(pathEditor) ) ){
			alert('外部テキストエディタが設定されていないか、存在しません。' + "\n" + msgSudgestSetting);
			console.error('ERROR: '+'外部テキストエディタが設定されていないか、存在しません。');
			return false;
		}
		if(_platform=='win'){
			px.utils.spawn(
				pathEditor,
				[
					path
				],
				{}
			);
		}else{
			px.utils.spawn(
				px.cmd('open'),
				[
					path,
					'-a',
					pathEditor
				],
				{}
			);
		}
		return true;
	}

	/**
	 * ターミナルで開く
	 */
	this.openInTerminal = function( path ){
		if( !this.utils.isDirectory(path) && !px.utils.isFile(path) ){
			alert('編集対象のパスが存在しません。'+"\n"+path);
			console.error('ERROR: '+'編集対象のパスが存在しません。'+"\n"+path);
			return false;
		}

		if(_platform=='win'){
			px.utils.exec( 'start cmd /K cd "'+ path + '"' );
		}else{
			var termProgram = 'Terminal';
			try {
				if( process.env.TERM_PROGRAM ){
					termProgram = process.env.TERM_PROGRAM;
				}
			} catch (e) {
			}

			px.utils.spawn(
				px.cmd('open'),
				[
					'-a',
					termProgram,
					path
				],
				{}
			);
		}
		return true;
	}


	/**
	 * ループバックIPアドレスかどうか調べる
	 */
	this.isLoopbackIp = function( ip ){
		switch( ip ){
			case '127.0.0.1':
			case '::127.0.0.1':
			case '::ffff:127.0.0.1':
			case '::1':
			case '0::1':
			case '0000::0001':
			case '0:0:0:0:0:0:0:1':
			case '0000:0000:0000:0000:0000:0000:0000:0001':
				// ホワイトリスト: ローカルIPは通す
				// ↑もっといい書き方ないか？
				return true;
				break;
			default:
				return false;
				break;
		}
		return false;
	}

	/**
	 * サブアプリケーション
	 */
	this.subapp = function(appName){
		var $cont = $('.contents').eq(0);
		$cont.html('<p style="text-align:center; margin: 4em auto;">Loading...</p>');

		if( typeof(_selectedProject) != typeof(0) ){
			appName = '';
		}else if( !appName && typeof(_selectedProject) == typeof(0) ){
			appName = 'fncs/home/index.html';
		}

		if( appName ){
			this.loadProject(function(){ // プロジェクトオブジェクトをリロードする。
				var projectStatus = _pj.status();
				// console.log(projectStatus);
				if( !projectStatus.isPxStandby ){
					switch(appName){
						case 'fncs/home/index.html':
						case 'fncs/config/index.html':
						case 'fncs/composer/index.html':
						case 'fncs/git/index.html':
							// プロジェクトの準備が整っていなかったら、
							// これ以外の画面には行けない。
							break;
						default:
							appName = 'fncs/home/index.html';
							break;
					}
				}
				$cont
					.html('')
					.append(
						$('<iframe>')
							.attr('src', './'+appName)
					)
				;

				_current_app = appName;
				layoutReset();
				$contents.scrollTop(0);
			});
			return;

		}else{
			// プロジェクト選択画面を描画
			$cont.html( $('script#template-selectProject-page').html() );
			$cont.find('.cont_top_footer p').text( _packageJson.pickles2.credit );

			this.getProjectList(function(list){
				if( list.length ){
					var $ul = $('<div class="list-group">');
					for( var i = 0; i < list.length; i++ ){
						$ul.append(
							$('<a class="list-group-item">')
								.attr('href', 'javascript:;')
								.data('path', list[i].getPath())
								.data('num', i)
								.on('click', function(){
									var timer = setTimeout(function(){
										px.progress.start({"showProgressBar":true, 'blindness':true});
									}, 1000);
									px.selectProject( $(this).data('num'), function(){
										clearTimeout(timer);
										px.progress.close();
										px.subapp();
									} );
								} )
								.text( list[i].getName() )
						);
					}

					$('.cont_project_list', $cont)
						.html('')
						.append($ul)
					;

				}else{
					$('.cont_project_list', $cont)
						.html('<p>プロジェクトは登録されていません。</p>')
					;
				}
				_current_app = appName;
				layoutReset();
				$contents.scrollTop(0);
			});
			return;
		}
	}


	/**
	 * ドロップ操作を無効化する
	 * @param  {element} $elm element object.
	 * @return {[type]}     [description]
	 */
	this.cancelDrop = function($elm){
		$($elm)
			.bind( 'drop', function(e){
				// ドロップ操作を無効化
				// console.log(456);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
			.bind( 'dragenter', function(e){
				// ドロップ操作を無効化
				// console.log(45645);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
			.bind( 'dragover', function(e){
				// ドロップ操作を無効化
				// console.log(23456);
				e.preventDefault();
				e.stopPropagation();
				return false;
			} )
		;
		return $elm;
	}

	/**
	 * レイアウトをリセット
	 */
	function layoutReset(){
		var cpj = px.getCurrentProject();
		var cpj_s = null;
		if( cpj !== null ){
			cpj_s = cpj.status()
		}

		$('.theme-header__gmenu').html( $('<ul>')
			.append( $('<li>')
				.append( '<span>&nbsp;</span>' )
			)
		);
		$shoulderMenu.find('ul').html('');
		_menu.drawGlobalMenu($shoulderMenu, _current_app);

		if( cpj === null ){
			$('.theme_px2logo').css({
				"width": 70,
				"height": 70
			});
			$('.theme_id')
				.css({"opacity":0})
			;
		}else{
			$('.theme_px2logo').css({
				"width": 45,
				"height": 45
			});
			$('.theme_id')
				.html('')
				.append( $('<div>')
					.text( /* '-> ' + */ cpj.get('name') )
				)
				.css({"opacity":1})
			;
		}

		$('body')
			.css({
				'margin':'0 0 0 0' ,
				'padding':'0 0 0 0' ,
				'width':'auto',
				'height':'auto',
				'min-height':0,
				'max-height':10000,
				'overflow':'hidden'
			})
		;
		$contents
			.css({
				'margin':'0 0 0 0' ,
				'padding':'0 0 0 0' ,
				'position':'fixed' ,
				'left':0 ,
				'top': $header.outerHeight()+0 ,
				'right': 0 ,
				'height': $(window).height() - $header.outerHeight() - $footer.outerHeight() - 0
			})
		;
		$contents.find('>iframe')
			.css({
				'height': $contents.innerHeight() - 7
			})
		;

		var $ul = $shoulderMenu.find('ul');
		$shoulderMenu.find('button')
			.css({
				'height': $header.outerHeight()
			})
		;
		$ul.css({
			top: $header.height() ,
			height: $(window).height()-$header.outerHeight()
		});
		if( $ul.css('display') == 'block' ){
			$shoulderMenu.css({
				width: '100%' ,
				height: $(window).height()
			});
		}else{
			$shoulderMenu
				.css({
					'height': $header.outerHeight()
				})
			;
		}

	}

	/**
	 * ログをファイルに出力
	 */
	this.log = function( msg ){
		return px.px2dtLDA.log(msg);
	}

	/**
	 * アプリケーションを終了する
	 */
	this.exit = function(){
		console.log( 'px.exit() called.' );
		// if(!confirm('exit?')){return;}
		try {
			if( _platform == 'win' ){
				nw.App.closeAllWindows();
			}else{
				nw.App.quit();
			}
		} catch (e) {
			console.error('Unknown Error on px.exit()');
		}
	}

	/**
	 * イベントセット
	 */
	process.on( 'exit', function(e){
		px.log( 'Application exit;' );
		px.save();
	});
	process.on( 'uncaughtException', function(e){
		// alert('ERROR: Uncaught Exception');
		console.error('ERROR: Uncaught Exception');
		console.error(e);
		px.log( 'ERROR: Uncaught Exception' );
		px.log( e );
	} );
	$(window).on( 'resize', function(e){
		layoutReset();
	} );
	// $(document).on( 'dblclick', function(e){
	// 	e.stopPropagation();
	// 	e.preventDefault();
	// 	return false;
	// } );


	/**
	 * アプリケーションを初期化
	 */
	$(function(){
		_it79.fnc({}, [
			function(it, arg){
				// init
				init(function(){
					it.next(arg);
				});
			} ,
			function(it, arg){

				// DOMスキャン
				$header   = $('.theme_header');
				$contents = $('.contents');
				$footer   = $('.theme_footer');
				// $dialog   = $('<div>');
				$shoulderMenu = $('.theme-header__shoulder-menu');

				$header.css({
					'border-bottom-color': _packageJson.pickles2.colors.defaultKeyColor,
					'color': _packageJson.pickles2.colors.defaultKeyColor
				});
				$header.find('.theme_px2logo a')
					.html(function(){
						var src = _fs.readFileSync('./app/common/images/logo.svg').toString();
						return src;
					})
					.find('path')
					.attr({'fill':_packageJson.pickles2.colors.defaultKeyColor})
				;

				it.next(arg);

			} ,
			function(it, arg){
				var $ul = $shoulderMenu.find('ul').hide();
				$shoulderMenu
					.css({
						'width': 50,
						'height': $header.height()
					})
					.on('click', function(){
						if( $ul.css('display') == 'block' ){
							$ul.hide();
							$shoulderMenu
								.css({
									'width':50 ,
									'height':$header.height()
								})
							;

						}else{
							$ul.show().height( $(window).height()-$header.height() );
							$shoulderMenu
								.css({
									'width':'100%' ,
									'height':$(window).height()
								})
							;

						}
					}
				);
				it.next(arg);
			} ,
			function(it, arg){
				_Keypress = new window.keypress.Listener();
				this.Keypress = _Keypress;

				_Keypress.simple_combo("backspace", function(e) {
					// バックスペースキーで編集画面などが閉じてしまう問題の対策。
					// px.message("You pressed backspace");
					switch(e.target.tagName.toLowerCase()){
						case 'input': case 'textarea':
							if(!$(e.target).attr('readonly')){
								return true;
							}
							break;
					}
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
				_Keypress.simple_combo("delete", function(e) {
					// バックスペースキーで編集画面などが閉じてしまう問題の対策。
					// px.message("You pressed delete");
					switch(e.target.tagName.toLowerCase()){
						case 'input': case 'textarea':
							if(!$(e.target).attr('readonly')){
								return true;
							}
							break;
					}
					e.preventDefault();
					e.stopPropagation();
					return false;
				});
				// _Keypress.simple_combo("escape", function(e) {
				// 	// px.message("You pressed escape");
				// 	e.preventDefault();
				// });

				_this.cancelDrop('html, body');

				it.next(arg);
			} ,
			function(it, arg){
				layoutReset();
				px.subapp();

				it.next(arg);
			}
		]);

		window.focus();
	});

	return this;
})(jQuery, window);
