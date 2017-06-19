module.exports = function( window, px, projectInfo, projectId, cbStandby ) {
	var _this = this;

	this.projectInfo = projectInfo;
	this.projectId = projectId;
	cbStandby = cbStandby||function(){};

	var _config = null;
	var _px2DTConfig = null;
	var _px2proj = null;
	var _path = require('path');
	var _pjError = [];
	var _projectStatus = null;


	/**
	 * projectオブジェクトを初期化
	 */
	function init(pj){

		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){

				// px2agent から プロジェクト情報を生成
				var px2agentOption = {
					'bin': px.nodePhpBin.getPath(),
					'ini': px.nodePhpBin.getIniPath(),
					'extension_dir': px.nodePhpBin.getExtensionDir()
				};
				// console.log(px2agentOption);
				_px2proj = px.px2agent.createProject(
					_path.resolve( pj.get('path') + '/' + pj.get('entry_script') ) ,
					px2agentOption
				);
				pj.px2proj = _px2proj;

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				pj.updateProjectStatus(function( tmpStatus ){
					_projectStatus = tmpStatus;
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_px2proj = false;
					pj.px2proj = _px2proj;
					rlv();
					return;
				}
				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_config = false;
					rlv();
					return;
				}

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.pathExists || !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					_px2DTConfig = false;
					rlv();
					return;
				}

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				if( !_projectStatus.entryScriptExists || !_projectStatus.vendorDirExists || !_projectStatus.composerJsonExists ){
					rlv();
					return;
				}
				if( _config === false ){
					rlv();
					return;
				}

				/**
				 * px.site
				 */
				pj.site = new (require('./pickles.project.site.js'))(px, pj, function(){
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// console.log('project "' + _this.projectInfo.name + '" (projectId: ' + _this.projectId + ') initialized.');
				cbStandby();
				rlv();
				return;
			}); })
		;
		return;
	} // init()


	/**
	 * プロジェクトのステータスを調べる
	 */
	this.status = function(){
		return _projectStatus;
	}

	/**
	 * プロジェクトステータスを更新する
	 * @param  {Function} callback callback function
	 * @return {Void} Return nothing.
	 */
	this.updateProjectStatus = function( callback ){
		callback = callback || function(){};
		var status = {};
		status.api = {
			"available": false,
			"version": false,
			"is_sitemap_loaded": false
		};
		status.px2dthelper = {
			"available": false,
			"version": false,
			"is_sitemap_loaded": false
		};
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				status.pathExists = px.utils79.is_dir( _this.get('path') );
				status.pathContainsFileCount = false;
				if( status.pathExists ){
					try {
						status.pathContainsFileCount = px.fs.readdirSync(_this.get('path')).length;
					} catch (e) {
					}
				}
				status.entryScriptExists = (status.pathExists && px.utils79.is_file( _this.get('path')+'/'+_this.get('entry_script') ) ? true : false);
				var homeDir = _this.get('path')+'/'+_this.get('home_dir');
				status.homeDirExists = (status.pathExists && px.utils79.is_dir( homeDir ) ? true : false);
				// status.confFileExists = (status.homeDirExists && (px.utils79.is_file( homeDir+'/config.php' )||px.utils79.is_file( homeDir+'/config.json' ) ) ? true : false);
				status.confFileExists = false;
				if(typeof(_config) === typeof({})){ status.confFileExists = true; }
				// status.px2DTConfFileExists = (status.homeDirExists && px.utils79.is_file( homeDir+'/px2dtconfig.json' ) ? true : false);
				status.px2DTConfFileExists = false;
				if(typeof(_px2DTConfig) === typeof({})){ status.px2DTConfFileExists = true; }
				status.composerJsonExists = (status.pathExists && px.utils79.is_file( _this.get_realpath_composer_root()+'/composer.json' ) ? true : false);
				status.vendorDirExists = (status.pathExists && px.utils79.is_dir( _this.get_realpath_composer_root()+'/vendor/' ) ? true : false);
				status.isPxStandby = ( status.pathExists && status.entryScriptExists && status.homeDirExists && status.confFileExists && status.composerJsonExists && status.vendorDirExists ? true : false );
				status.gitDirExists = (function(path){
					function checkParentDir(path){
						if( status.pathExists && px.utils79.is_dir( path+'/.git/' ) ){
							return true;
						}
						var nextPath = px.utils.dirname( path );
						if( nextPath == path ){
							return false;
						}
						return checkParentDir( nextPath );
					}
					return checkParentDir(path);
				})( _this.get('path') );

				rlv();
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// Pickles Framework のバージョンを確認
				// かつ、 PX=api が利用できるか確認
				_config = false;
				_px2DTConfig = false;
				_this.px2dthelperGetAll('/', {'filter': false}, function(pjInfo){
					// console.log(pjInfo);
					if(pjInfo === false){
						console.error('FAILED to getting data from "/?PX=px2dthelper.get.all"');
						rlv();
						return;
					}
					try {
						status.api.version = pjInfo.check_status.pxfw_api.version;
						status.api.available = (pjInfo.check_status.pxfw_api.version ? true : false);
						status.api.is_sitemap_loaded = pjInfo.check_status.pxfw_api.is_sitemap_loaded;

						status.px2dthelper.version = pjInfo.check_status.px2dthelper.version;
						status.px2dthelper.available = (pjInfo.check_status.px2dthelper.version ? true : false);
						status.px2dthelper.is_sitemap_loaded = pjInfo.check_status.px2dthelper.is_sitemap_loaded;

						try{
							_config = pjInfo.config;
							if( _config.plugins && _config.plugins.px2dt ){
								_px2DTConfig = _config.plugins.px2dt;
							}
						}catch(e){
							console.error('FAILED to parse JSON "Pickles 2" config.');
							console.error(data_json_string);
							_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
							_config = false;
							_px2DTConfig = false;
						}
					} catch (e) {
						console.error('FAILED to getting data from "/?PX=px2dthelper.get.all"');
					}
					rlv();
				});
				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// console.log(_config);
				if( typeof(_config) == typeof({}) && _config !== null ){
					// コンフィグがロードできていればOK
					rlv();
					return;
				}

				// px2dthelper.get.all が利用できない場合、
				// 旧来のAPIを使って地道にデータを集める。
				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv2, rjt2){
						_px2proj.query(
							'/?PX=api.get.config',
							{
								"output": "json",
								"complete": function(data_json_string, code){
									// console.log(data_json_string, code);
									if( code == 0 ){
										_config = false;
										_px2DTConfig = false;
										try{
											var _config = JSON.parse(data_json_string);
											if( _config.plugins && _config.plugins.px2dt ){
												_px2DTConfig = _config.plugins.px2dt;
											}
										}catch(e){
											console.error('FAILED to parse JSON "Pickles 2" config.');
											console.error(data_json_string);
											_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
											_config = false;
											_px2DTConfig = false;
										}
									}
									rlv2();
									return;
								}
							}
						);
						return;
					}); })
					.then(function(){ return new Promise(function(rlv2, rjt2){
						// console.log('------------------ config loaded', _config);
						rlv();
						return;
					}); })
				;

				return;
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// console.log(status);
				callback(status);
				return;
			}); })
		;
		return;
	} // updateProjectStatus()

	/** PXコマンドのバージョンが適合するか調べる */
	this.checkPxCmdVersion = function( cond, callbackOk, callbackNg ){
		cond = cond||{};
		callbackOk = callbackOk || function(){};
		callbackNg = callbackNg || function(){};
		var pjStatus = this.status();
		var errors = [];
		var semver = px.semver;

		function versionClean(version){
			if(typeof(version) != typeof('')){return false;}
			version = semver.clean(version);
			version = version.replace( /^([0-9]+\.[0-9]+\.[0-9]+)[\s\S]*$/, '$1' );
			return version;
		}

		if( (cond.apiVersion) ){
			if( !pjStatus.api.available ){
				errors.push( 'PX=api が利用できません。' );
			}
			if( !pjStatus.api.is_sitemap_loaded ){
				errors.push( 'PX=api がサイトマップ情報をロードできません。' );
			}
			var apiVersion = versionClean(pjStatus.api.version);
			if( !semver.valid(apiVersion) || !semver.satisfies(apiVersion, cond.apiVersion) ){
				errors.push( 'pickles2/px-fw-2.x のバージョンを '+cond.apiVersion+' に更新してください。 (ロードされたバージョン: '+pjStatus.api.version+')' );
			}
		}

		if( (cond.px2dthelperVersion) ){
			if( !pjStatus.px2dthelper.available ){
				errors.push( 'PX=px2dthelper が利用できません。' );
			}
			if( !pjStatus.px2dthelper.is_sitemap_loaded ){
				errors.push( 'PX=px2dthelper がサイトマップ情報をロードできません。' );
			}
			var px2dthelperVersion = versionClean(pjStatus.px2dthelper.version);
			if( !semver.valid(px2dthelperVersion) || !semver.satisfies(px2dthelperVersion, cond.px2dthelperVersion) ){
				errors.push( 'pickles2/px2-px2dthelper のバージョンを '+cond.px2dthelperVersion+' に更新してください。 (ロードされたバージョン: '+pjStatus.px2dthelper.version+')' );
			}
		}

		if( errors.length ){
			callbackNg( errors ); return;
		}
		callbackOk();
		return;
	}

	/** プロジェクト情報を取得する */
	this.get = function(key){
		return this.projectInfo[key];
	}

	/** プロジェクト情報をセットする */
	this.set = function(key, val){
		this.projectInfo[key] = val;
		return this;
	}

	/** サイトマップファイルの一覧を取得する */
	this.getSitemapFilelist = function(){
		var pathDir = this.get('path')+'/'+this.get('home_dir')+'/sitemaps/';
		var filelist = px.fs.readdirSync( pathDir );
		var rtn = [];
		for( var idx in filelist ){
			if( filelist[idx].match( /^\~\$/ ) ){
				// エクセルの編集中のキャッシュファイルのファイル名だからスルー
				continue;
			}
			if( filelist[idx].match( /^\.\~lock\./ ) ){
				// Libre Office, Open Office の編集中のキャッシュファイルのファイル名だからスルー
				continue;
			}

			rtn.push( filelist[idx] );
		}
		return rtn;
	}

	/** サイトマップファイルを削除する */
	this.deleteSitemapFile = function(basefilename, callback){
		callback = callback || function(){};
		var result = true;
		var pathDir = this.get('path')+'/'+this.get('home_dir')+'/sitemaps/';
		var filelist = this.getSitemapFilelist();
		for( var idx in filelist ){
			try {
				var filename = filelist[idx].replace(/\.[a-zA-Z0-9]+$/, '');
				var ext = px.utils.getExtension(filelist[idx]).toLowerCase();
				if( filename == basefilename ){
					px.fs.unlinkSync( pathDir+filelist[idx] );
					if( px.utils79.is_file( pathDir+filelist[idx] ) ){
						result = false; // 消えてない場合
					}
				}
			} catch (e) {
			}
		}
		callback(result);
		return;
	}

	/** プロジェクト設定情報を取得する */
	this.getConfig = function(){
		return _config;
	}

	/** プロジェクト設定情報を更新する (非同期) */
	this.updateConfig = function( callback ){
		callback = callback||function(){};
		this.execPx2(
			'/?PX=api.get.config',
			{
				complete: function(data_json_string){
					_config = false;
					_px2DTConfig = false;
					try{
						_config = JSON.parse(data_json_string);
						if( _config.plugins && _config.plugins.px2dt ){
							_px2DTConfig = _config.plugins.px2dt;
						}
					}catch(e){
						console.error('FAILED to parse JSON "Pickles 2" config.');
						console.error(data_json_string);
						_this.error( 'FAILED to parse JSON "Pickles 2" config.'+"\n"+'------------'+"\n\n"+data_json_string );
						_config = false;
						_px2DTConfig = false;
					}
					callback( _config );
				}
			}
		);
		return this;
	}

	/** Pickles 2 設定情報を取得する */
	this.getPx2DTConfig = function(){
		return _px2DTConfig;
	}

	/** Pickles 2 設定情報を更新する (非同期) */
	this.updatePx2DTConfig = function( callback ){
		callback = callback||function(){};

		var conf = this.getConfig();
		if( conf.plugins && conf.plugins.px2dt ){
			_px2DTConfig = conf.plugins.px2dt;
			callback( _px2DTConfig );
			return this;
		}

		_px2DTConfig = {};
		var path = this.get('path')+'/'+this.get('home_dir')+'/px2dtconfig.json';

		if( !px.utils79.is_file( path ) ){
			callback( null );
			return this;
		}
		px.fs.readFile( path, {}, function(err, data_json_string){
			try{
				_px2DTConfig = JSON.parse( data_json_string.toString() );
			}catch(e){
				console.error('FAILED to parse `px2dtconfig.json`.');
				console.error(data_json_string);
				_this.error( 'FAILED to parse `px2dtconfig.json`.'+"\n"+'------------'+"\n\n"+data_json_string );
				_px2DTConfig = false;
			}
			callback( _px2DTConfig );
		} );
		return this;
	}

	/** サイトマップを取得する */
	this.getSitemap = function(){
		return this.site.getSitemap();
	}

	/** サイトマップを更新する (非同期) */
	this.updateSitemap = function( callback ){
		return this.site.updateSitemap( callback );
	}

	/** Pickles 2 を実行する (非同期) */
	this.execPx2 = function( cmd, opts ){
		opts = opts||{};
		opts.complete = opts.complete||function(){};
		if( _px2proj === false ){
			opts.complete(false);
			return this;
		}
		_px2proj.query(
			cmd,
			{
				"output": "json",
				"userAgent": "Mozilla/5.0",
				"complete": function(data, code){
					opts.complete(data);
				}
			}
		);
		return this;
	}

	/**
	 * composerを実行する
	 *
	 * node-php-bin の PHP などを考慮して、
	 * -c, -d オプションの解決を自動的にやっている前提で、
	 * composer コマンドを実行します。
	 * 基本的には px.execComposer() をラップするメソッドですが、
	 * cwd オプションを自動的に付与する点が異なります。
	 *
	 * @param  {[type]} cmd  [description]
	 * @param  {[type]} opts [description]
	 * @return {[type]}      [description]
	 */
	this.execComposer = function( cmd, opts ){
		opts = opts||{};
		opts.success = opts.success||function(){};
		opts.error = opts.error||function(){};
		opts.complete = opts.complete||function(){};
		opts.cwd = this.get_realpath_composer_root();
		px.execComposer(
			cmd ,
			opts
		);
		return this;
	}
	/**
	 * プロジェクトのフォルダを開く
	 */
	this.open = function(){
		return window.px.utils.openURL(this.get('path'));
	}

	/**
	 * `?PX=px2dthelper.get.all` を実行する
	 */
	this.px2dthelperGetAll = function(path, options, callback){
		callback = callback || function(){};
		if( !path ){
			path = '/';
		}
		options = options || {};
		options.filter = !!options.filter;
		_px2proj.query(
			this.getConcretePath(path)+'?PX=px2dthelper.get.all&filter='+(options.filter?'true':'false'),
			{
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var pjInfo = false;
					try {
						pjInfo = JSON.parse(data);
					} catch (e) {
					}
					callback(pjInfo);
					return;
				}
			}
		);

		return;
	}

	/**
	 * ページパスからコンテンツを探す
	 */
	this.findPageContent = function( pagePath ){
		var pageInfo = this.site.getPageInfo( pagePath );
		var contLocalpath = pageInfo.content;

		for( var tmpExt in _config.funcs.processor ){
			if( px.fs.existsSync( this.get_realpath_controot()+'/'+contLocalpath+'.'+ tmpExt) ){
				contLocalpath = contLocalpath+'.'+ tmpExt;
				break;
			}
		}
		return contLocalpath;
	}

	/**
	 * コンテンツパスが、2重拡張子か調べる
	 */
	this.isContentDoubleExtension = function( contentPath ){
		var rtn = false;
		for( var tmpExt in _config.funcs.processor ){
			if( contentPath.match( new RegExp( '\\.[a-zA-Z0-9\\_\\-]+?\\.'+px.utils.escapeRegExp(tmpExt)+'$' ) ) ){
				rtn = true;
				break;
			}
		}
		return rtn;
	}

	/**
	 * ページパスからコンテンツの種類(編集モード)を取得する (非同期)
	 */
	this.getPageContentEditorMode = function( pagePath, callback ){
		callback = callback || function(){};

		_px2proj.query(
			this.getConcretePath(pagePath)+'?PX=px2dthelper.check_editor_mode', {
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var rtn = JSON.parse(data);
					callback(rtn);
					return;
				}
			}
		);
		return;
	}// getPageContentEditorMode()

	/**
	 * コンテンツパスから専有リソースディレクトリパスを探す
	 */
	this.getContentFilesByPageContent = function( contentPath ){
		var conf = this.getConfig();
		var rtn = conf.path_files;
		if( typeof(rtn) !== typeof('') ){
			rtn = '{$dirname}/{$filename}_files/'; // <- default
		}
		var $data = {
			'dirname': px.utils.dirname(contentPath),
			'filename': px.utils.basename(px.utils.trim_extension(px.utils.trim_extension(contentPath))),
			'ext': px.utils.getExtension(contentPath).toLowerCase(),
		};
		rtn = rtn.replace( '{$dirname}', $data['dirname'], rtn );
		rtn = rtn.replace( '{$filename}', $data['filename'], rtn );
		rtn = rtn.replace( '{$ext}', $data['ext'], rtn );
		rtn = rtn.replace( /^\/*/, '/', rtn );
		rtn = rtn.replace( /\/*$/, '', rtn )+'/';
		return rtn;
	} // getContentFilesByPageContent

	/**
	 * コンテンツの種類(編集モード)を変更する (非同期)
	 */
	this.changeContentEditorMode = function( pagePath, editorModeTo, callback ){
		callback = callback || function(){};
		_px2proj.query(
			this.getConcretePath(pagePath)+'?PX=px2dthelper.change_content_editor_mode&editor_mode='+editorModeTo, {
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var rtn = JSON.parse(data);
					callback(rtn);
					return;
				}
			}
		);
		return;
	}

	/**
	 * 具体的なパスを取得する
	 */
	this.getConcretePath = function(pagePath){
		if( pagePath.match( /^alias[0-9]*\:([\s\S]+)/ ) ){
			//  エイリアスを解決
			pagePath = RegExp.$1;
		}else if( pagePath.match( /\{[\s\S]+\}/ ) ){
			//  ダイナミックパスをバインド
			var $tmp_path = pagePath;
			pagePath = '';
			while( 1 ){
				if( !$tmp_path.match( /^([\s\S]*?)\{(\$|\*)([a-zA-Z0-9\_\-]*)\}([\s\S]*)$/ ) ){
					pagePath += $tmp_path;
					break;
				}
				pagePath += RegExp.$1;
				var paramName = RegExp.$3;
				$tmp_path = RegExp.$4;

				if( typeof(paramName) != typeof('') || !paramName.length ){
					//無名のパラメータはバインドしない。
				}else{
					pagePath += paramName;
				}
				continue;
			}
		}
		return pagePath;
	}

	/**
	 * GUI編集エンジンの種類を取得する
	 *
	 * 旧GUI編集(legacy)から、新GUI編集エンジン(broccoli-html-editor)に移行する
	 * 過渡期に使用する一時的な機能として実装します。
	 * Pickles2 の config.php に、plugins.px2dt.guiEngine を設定すると、
	 * GUI編集エンジンを切り替えることができます。
	 *
	 * 設定できる値は、以下です。
	 * - legacy = 旧GUI編集 (このオプションは 2.0.0-beta.17 で廃止されました)
	 * - broccoli-html-editor = 新エンジン broccoli (default)
	 */
	this.getGuiEngineName = function(){
		try {
			var conf = this.getConfig();
			if( conf && conf.plugins && conf.plugins.px2dt && conf.plugins.px2dt.guiEngine ){
				switch(conf.plugins.px2dt.guiEngine){
					case 'legacy': // Obsoleted Option
						console.error('[Notice] guiEngine "legacy" is a obsoleted option. Selected "broccoli-html-editor" instead.');
						// return conf.plugins.px2dt.guiEngine;
						break;
					default:
						break;
				}
			}
		} catch (e) {
		}
		return 'broccoli-html-editor';
	}

	/**
	 * GUI編集のコンテンツをビルドする
	 */
	this.buildGuiEditContent = function( pagePath, callback ){
		callback = callback||function(){};
		var pj = this;
		this.getPageContentEditorMode(pagePath, function(editorMode){
			if( editorMode != 'html.gui' ){
				callback(false);
				return;
			}

			// broccoli-html-editor
			pj.createBroccoliServer(pagePath, function(broccoli){
				broccoli.updateContents(
					function(result){
						callback(result);
					}
				);
			});

		});
		return this;
	}// buildGuiEditContent()

	/**
	 * broccoli(サーバーサイド)を生成する
	 */
	this.createBroccoliServer = function(page_path, callback){
		callback = callback || function(){};
		var Broccoli = require('broccoli-html-editor');
		var path = require('path');
		var _pj = this;

		var documentRoot = path.resolve(this.get('path'), this.get('entry_script'), '..')+'/'
		var realpathDataDir,
			pathResourceDir;
		var pageInfo = this.site.getPageInfo( page_path );
		var px2conf = this.getConfig();

		function parseConfig(callback){
			var utils79 = px.utils79;
			// console.log(px2conf.plugins.px2dt);
			function bind( tpl ){
				var data = {
					'dirname' : utils79.dirname( pageInfo.content ),
					'filename' : utils79.basename( (function(path){
						var rtn = path.replace( new RegExp('\\.[a-zA-Z0-9\\_\\-]+$'), '' );
						return rtn;
					})( pageInfo.content ) ),
					'ext' : (function(path){
						path.match( new RegExp('\\.([a-zA-Z0-9\\_\\-]+)$') );
						var rtn = (RegExp.$1).toLowerCase();
						return rtn;
					})( pageInfo.content )
				};

				tpl = tpl.replace( '{$dirname}', data['dirname'] );
				tpl = tpl.replace( '{$filename}', data['filename'] );
				tpl = tpl.replace( '{$ext}', data['ext'] );

				return tpl;
			}

			try {
				if( px2conf.plugins.px2dt.guieditor.path_resource_dir ){
					pathResourceDir = bind( px2conf.plugins.px2dt.guieditor.path_resource_dir );
					pathResourceDir = require('path').resolve('/' + px2conf.path_controot + '/' + pathResourceDir)+'/';
					// console.log(pathResourceDir);
				}
			} catch (e) {
			}

			try {
				if( px2conf.plugins.px2dt.guieditor.path_data_dir ){
					realpathDataDir = bind( px2conf.plugins.px2dt.guieditor.path_data_dir );
					realpathDataDir = require('path').resolve('/', documentRoot+'/'+px2conf.path_controot, realpathDataDir)+'/';
					// console.log(realpathDataDir);
				}
			} catch (e) {
			}

			// console.log(pathResourceDir);
			// console.log(realpathDataDir);
			setTimeout(function(){
				callback();
			}, 0);
			return;
		}

		_pj.px2proj.realpath_files(page_path, '', function(realpath){
			realpathDataDir = path.resolve(realpath, 'guieditor.ignore')+'/';

			_pj.px2proj.path_files(page_path, '', function(localpath){
				pathResourceDir = path.resolve(localpath, 'resources')+'/';
				pathResourceDir = pathResourceDir.replace(new RegExp('\\\\','g'), '/').replace(new RegExp('^[a-zA-Z]\\:\\/'), '/');
					// Windows でボリュームラベル "C:" などが含まれるようなパスを渡すと、
					// broccoli-html-editor内 resourceMgr で
					// 「Uncaught RangeError: Maximum call stack size exceeded」が起きて落ちる。
					// ここで渡すのはウェブ側からみえる外部のパスでありサーバー内部パスではないので、
					// ボリュームラベルが付加された値を渡すのは間違い。

				parseConfig(function(){

					// broccoli setup.
					var broccoli = new Broccoli();

					// console.log(broccoli);
					broccoli.init(
						{
							'appMode': 'desktop', // 'web' or 'desktop'. default to 'web'
							'paths_module_template': _pj.getConfig().plugins.px2dt.paths_module_template ,
							'documentRoot': documentRoot,
							'pathHtml': page_path,
							'pathResourceDir': pathResourceDir,
							'realpathDataDir': realpathDataDir,
							'customFields': _pj.mkBroccoliCustomFieldOptionBackend() ,
							'bindTemplate': function(htmls, callback){
								var fin = '';
								for( var bowlId in htmls ){
									if( bowlId == 'main' ){
										fin += htmls['main'];
									}else{
										fin += "\n";
										fin += "\n";
										fin += '<?php ob_start(); ?>'+"\n";
										fin += htmls[bowlId]+"\n";
										fin += '<?php $px->bowl()->send( ob_get_clean(), '+JSON.stringify(bowlId)+' ); ?>'+"\n";
										fin += "\n";
									}
								}
								callback(fin);
								return;
							} ,
							'log': function(msg){
								px.log(msg);
							}

						},
						function(){
							callback(broccoli);
						}
					);
				});
			});
		});
		return this;
	}

	/**
	 * pickles2-contents-editor(サーバーサイド)を生成する
	 */
	this.createPickles2ContentsEditorServer = function(page_path, callback){
		callback = callback || function(){};
		var Px2CE = require('pickles2-contents-editor');
		var _pj = this;

		// pickles2-contents-editor setup.
		var px2ce = new Px2CE();

		// console.log(broccoli);
		// console.log(require('path').resolve('/', './'+page_path));
		px2ce.init(
			{
				'page_path': page_path,
				'appMode': 'desktop', // 'web' or 'desktop'. default to 'web'
				'entryScript': require('path').resolve( _pj.get('path'), _pj.get('entry_script') ),
				'customFields': _pj.mkBroccoliCustomFieldOptionBackend() ,
				'customFieldsIncludePath': _pj.mkBroccoliCustomFieldIncludePathOptionBackend() ,
				'log': function(msg){
					px.log(msg);
				},
				'commands':{
					'php': px.nodePhpBinOptions
				}
			},
			function(){
				callback(px2ce);
			}
		);

		return this;
	}

	/**
	 * broccoli-html-editorのカスタムフィールドオプションを生成する (frontend)
	 */
	this.mkBroccoliCustomFieldOptionFrontend = function(window, isLoadProjectCustomField){
		var rtn = {
			'href': window.BroccoliFieldHref,
			// 'psd': window.BroccoliFieldPSD,
			'table': window.BroccoliFieldTable
		};

		if( !isLoadProjectCustomField ){
			// プロジェクトカスタムフィールドをロードしない場合
			return rtn;
		}

		var confCustomFields = {};
		try {
			confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for( var fieldName in confCustomFields ){
				try {
					if( confCustomFields[fieldName].frontend.file && confCustomFields[fieldName].frontend.function ){
						// console.log(eval( confCustomFields[fieldName].frontend.function ));
						rtn[fieldName] = eval( confCustomFields[fieldName].frontend.function );
					}else{
						console.error( 'FAILED to load custom field: ' + fieldName + ' (frontend);' );
						console.error( 'unknown type' );
					}
				} catch (e) {
					console.error( 'FAILED to load custom field: ' + fieldName + ' (frontend);' );
					console.error(e);
				}
			}
		} catch (e) {
		}

		return rtn;
	}

	/**
	 * broccoli-html-editorのカスタムフィールドオプションを生成する (backend)
	 */
	this.mkBroccoliCustomFieldOptionBackend = function(){
		var rtn = {
			'href': require('./../common/broccoli/broccoli-field-href/server.js'),
			// 'psd': require('broccoli-field-psd'),
			'table': require('broccoli-field-table').get({
				'php': px.nodePhpBinOptions
			})
		};

		var confCustomFields = {};
		try {
			confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for( var fieldName in confCustomFields ){
				try {
					if( confCustomFields[fieldName].backend.require ){
						rtn[fieldName] = require( require('path').resolve(this.get_realpath_controot(), confCustomFields[fieldName].backend.require) );
					}else{
						console.error( 'FAILED to load custom field: ' + fieldName + ' (backend);' );
						console.error( 'unknown type' );
					}
				} catch (e) {
					console.error( 'FAILED to load custom field: ' + fieldName + ' (backend);' );
					console.error(e);
				}
			}
		} catch (e) {
		}

		return rtn;
	}
	/**
	 * px2cdのカスタムフィールドインクルードパスオプションを生成する (backend)
	 */
	this.mkBroccoliCustomFieldIncludePathOptionBackend = function(){
		var rtn = [];
		var entryScript = _path.resolve( this.get('path') + '/' + this.get('entry_script') );

		var confCustomFields = [];
		try {
			var confCustomFields = this.getConfig().plugins.px2dt.guieditor.custom_fields;
			for(var fieldName in confCustomFields){
				if( confCustomFields[fieldName].frontend.file && confCustomFields[fieldName].frontend.function ){
					var pathJs = _path.resolve(entryScript, '..', confCustomFields[fieldName].frontend.file);
					rtn.push( 'file://'+pathJs );
				}
			}

		} catch (e) {
		}
		// console.log(rtn);

		return rtn;
	}

	/**
	 * pickles2-module-editor(サーバーサイド)を生成する
	 */
	this.createPickles2ModuleEditorServer = function(callback){
		callback = callback || function(){};
		var Px2ME = require('pickles2-module-editor');
		var _pj = this;

		// pickles2-module-editor setup.
		var px2me = new Px2ME();

		px2me.init(
			{
				'appMode': 'desktop', // 'web' or 'desktop'. default to 'web'
				'entryScript': require('path').resolve( _pj.get('path'), _pj.get('entry_script') ),
				'log': function(msg){
					px.log(msg);
				},
				'commands':{
					'php': px.nodePhpBinOptions
				}
			},
			function(){
				callback(px2me);
			}
		);

		return this;
	}

	/**
	 * broccoli-processor オブジェクトを生成する
	 * @param  {Function} callback [description]
	 * @return {Void}            [description]
	 */
	this.createBroccoliProcessor = function( page_path, callback ){
		callback = callback || function(){};
		var BroccoliProcessor = require('broccoli-processor');

		this.createPickles2ContentsEditorServer( page_path, function(px2ce){
			px2ce.createBroccoli(function(broccoli){
				var broccoliProcessor = new BroccoliProcessor(broccoli, {});
				callback( broccoliProcessor );
			});
		} );
		return;
	}

	/**
	 * コンテンツをコピーする
	 */
	this.copyContentsData = function( pathFrom, pathTo, callback ){
		callback = callback || function(){};
		_px2proj.query(
			this.getConcretePath(pathTo)+'?PX=px2dthelper.copy_content&from='+this.getConcretePath(pathFrom)+'&to='+this.getConcretePath(pathTo), {
				"output": "json",
				"complete": function(data, code){
					// console.log(data, code);
					var rtn = JSON.parse(data);
					callback(rtn);
					return;
				}
			}
		);
		return;
	}

	/**
	 * gitディレクトリの絶対パスを得る
	 *
	 * @return string gitディレクトリのパス(.git の親ディレクトリ)
	 */
	this.get_realpath_git_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( px.utils79.is_dir( path ) && px.utils79.is_dir( path+'/.git/' ) ){
					return px.fs.realpathSync(path)+'/';
				}
				var nextPath = px.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_git_root()

	/**
	 * composerのルートの絶対パスを得る
	 *
	 * @return string composer のルートディレクトリのパス(composer.json の親ディレクトリ)
	 */
	this.get_realpath_composer_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( px.utils79.is_dir( path ) && px.utils79.is_file( path+'/composer.json' ) ){
					return px.fs.realpathSync(path)+'/';
				}
				var nextPath = px.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_composer_root()


	/**
	 * npmのルートの絶対パスを得る
	 *
	 * @return string npm のルートディレクトリのパス(package.json の親ディレクトリ)
	 */
	this.get_realpath_npm_root = function(){
		return (function(path){
			function checkParentDir(path){
				if( px.utils79.is_dir( path ) && px.utils79.is_file( path+'/package.json' ) ){
					return px.fs.realpathSync(path)+'/';
				}
				var nextPath = px.utils.dirname( path );
				if( nextPath == path ){
					return false;
				}
				return checkParentDir( nextPath );
			}
			return checkParentDir(path);
		})( this.get_realpath_controot() );
	}// get_realpath_npm_root()


	/**
	 * コンテンツルートの絶対パスを得る
	 *
	 * @return string コンテンツルートディレクトリの絶対パス(.px_execute.php の親ディレクトリ)
	 */
	this.get_realpath_controot = function(){
		var pathBase = this.get('path');
		if( px.utils79.is_file( this.get('path')+'/'+this.get('entry_script') ) ){
			pathBase = px.utils.dirname( px.fs.realpathSync( this.get('path')+'/'+this.get('entry_script') ) )+'/';
		}
		return pathBase;
	}// get_realpath_controot()



	/**
	 * directory_index(省略できるファイル名) の一覧を得る。
	 *
	 * @return array ディレクトリインデックスの一覧
	 */
	this.get_directory_index = function(){
		var $tmp_di = _config.directory_index;
		var directory_index = [];
		for( var idx in $tmp_di ){
			var $file_name = $tmp_di[idx];
			$file_name = px.php.trim( $file_name );
			if( !$file_name.length ){ continue; }
			directory_index.push( $file_name );
		}
		if( !directory_index.length ){
			directory_index.push( 'index.html' );
		}
		return directory_index;
	}// get_directory_index()

	/**
	 * directory_index のいずれかにマッチするためのpregパターン式を得る。
	 *
	 * @return string pregパターン
	 */
	this.get_directory_index_preg_pattern = function(){
		var $directory_index = this.get_directory_index();
		for( var $key in $directory_index ){
			var $row = $directory_index[$key];
			$directory_index[$key] = px.utils.escapeRegExp($row);
		}
		var $rtn = '(?:'+$directory_index.join( '|' )+')';
		return $rtn;
	}//get_directory_index_preg_pattern()


	/**
	 * 最も優先されるインデックスファイル名を得る。
	 *
	 * @return string 最も優先されるインデックスファイル名
	 */
	this.get_directory_index_primary = function(){
		var $directory_index = this.get_directory_index();
		return $directory_index[0];
	}//get_directory_index_primary()


	/**
	 * ファイルの処理方法を調べる。
	 *
	 * @param string $path パス
	 * @return string 処理方法
	 * - ignore = 対象外パス
	 * - direct = 加工せずそのまま出力する(デフォルト)
	 * - その他 = process名を格納して返す
	 */
	this.get_path_proc_type = function( $path ){
		var $rtn = [];
		if( $path === null || $path === undefined ){
			$path = '/';
		}
		$path = px.utils.get_realpath( '/'+$path );
		if( px.utils79.is_dir('./'+$path) ){
			$path += '/';
		}
		$path = px.utils.normalize_path( $path );

		if( typeof($rtn[$path]) === typeof(true) ){
			return $rtn[$path];
		}

		for( var $row in _config.paths_proc_type ){
			var $type = _config.paths_proc_type[$row];
			if(typeof($row) !== typeof('')){continue;}
			var $preg_pattern = px.utils.escapeRegExp( px.utils.normalize_path( px.utils.get_realpath($row) ) );
			if( $preg_pattern.match( new RegExp('\\*') ) ){
				// ワイルドカードが使用されている場合
				$preg_pattern = px.utils.escapeRegExp($row);
				$preg_pattern = $preg_pattern.replace( new RegExp( px.utils.escapeRegExp('\\*'),'g'), '(?:.*?)');//ワイルドカードをパターンに反映
				$preg_pattern = $preg_pattern+'$';//前方・後方一致
			}else if(px.utils79.is_dir($row)){
				$preg_pattern = px.utils.escapeRegExp( px.utils.normalize_path( px.utils.get_realpath($row) )+'/');
			}else if(px.utils79.is_file($row)){
				$preg_pattern = px.utils.escapeRegExp( px.utils.normalize_path( px.utils.get_realpath($row) ));
			}
			if( $path.match( new RegExp('^'+$preg_pattern) ) ){
				$rtn[$path] = $type;
				return $rtn[$path];
			}
		}
		$rtn[$path] = 'direct';// <- default
		return $rtn[$path];
	}//get_path_proc_type();


	/**
	 * コンテンツルートディレクトリのパス(=install path) を取得する
	 * @return string コンテンツディレクトリのパス
	 */
	this.get_path_controot = function(){
		var $rtn = '/';

		if( px.utils.strlen( _config.path_controot ) ){
			$rtn = _config.path_controot;
			$rtn = $rtn.replace(new RegExp('^(.*?)\\/*$'), '$1/');
			$rtn = px.utils.normalize_path($rtn);
			return $rtn;
		}

		$rtn = px.utils.normalize_path($rtn);
		return $rtn;
	}


	/**
	 * コンテンツファイルの初期化(=なかったものを新規作成)
	 */
	this.initContentFiles = function( pagePath, opt ){
		opt = opt||{};
		opt.success = opt.success||function(){};
		opt.error = opt.error||function(){};
		opt.complete = opt.complete||function(){};
		opt.proc_type = opt.proc_type||'html';

		var pageInfo = this.site.getPageInfo(pagePath);
		if( pageInfo == null ){
			opt.error("Page not Exists.");
			opt.complete();
			return false;
		}
		var contPath = this.findPageContent(pagePath);
		if( px.fs.existsSync( this.get_realpath_controot() + contPath ) ){
			opt.error("Content Already Exists.");
			opt.complete();
			return false;
		}
		switch( opt.proc_type ){
			case 'html.gui':
			case 'html':
			case 'md':
				// OK
				break;
			default:
				opt.error('Unknown proc_type "'+opt.proc_type+'".');
				opt.complete();
				return false;
				break;
		}

		var pathInfo = px.utils.parsePath( this.get_realpath_controot() + contPath );
		var prop = {}
		prop.realpath_cont = pathInfo.path;
		prop.realpath_resource_dir = this.get_realpath_controot() + this.getContentFilesByPageContent(contPath);
		prop.proc_type = opt.proc_type;
		if( prop.proc_type == 'md' ){
			prop.realpath_cont += '.'+prop.proc_type;
		}

		px.utils.iterateFnc([
			function(it, prop){
				// 格納ディレクトリを作る
				if( px.utils79.is_dir( px.utils.dirname( prop.realpath_cont ) ) ){
					it.next(prop);
					return;
				}
				// 再帰的に作る mkdirAll()
				if( !px.utils.mkdirAll( px.utils.dirname( prop.realpath_cont ) ) ){
					opt.error(err);
					opt.complete();
					return;
				}
				it.next(prop);
			} ,
			function(it, prop){
				// コンテンツ自体を作る
				px.fs.writeFile( prop.realpath_cont, '', function(err){
					if( err ){
						opt.error(err);
						opt.complete();
						return;
					}
					it.next(prop);
				} );
			} ,
			function(it, prop){
				// リソースディレクトリを作る
				if( !px.utils79.is_dir( prop.realpath_resource_dir ) ){
					px.utils.mkdirAll( prop.realpath_resource_dir );
				}
				if( prop.proc_type == 'html.gui' ){
					try {
						px.fs.mkdirSync( prop.realpath_resource_dir + '/guieditor.ignore/' );
					} catch (e) {
						it.next(prop);
					} finally {
						px.fs.writeFile( prop.realpath_resource_dir + '/guieditor.ignore/data.json', '{}', function(err){
							if( err ){
								opt.error(err);
								opt.complete();
								return;
							}
							it.next(prop);
						} );
					}

				}else{
					it.next(prop);
				}
			} ,
			function(it, prop){
				opt.success();
				opt.complete();
				return;
				it.next(prop);
			}
		]).start(prop);

		return true;
	}

	/**
	 * 検索オブジェクトを生成・取得する
	 */
	this.createSearcher = function(){
		return new (require('./pickles.project.searcher.js'))(px, this);
	}

	/**
	 * 検索オブジェクトを生成・取得する
	 */
	this.git = function(){
		return new (require('./pickles.project.git.js'))(px, this);
	}

	/**
	 * エラーメッセージを報告
	 */
	this.error = function( message ){
		// console.error( message );
		_pjError.push( {
			'message': message
		} );
		return true;
	}

	/**
	 * エラーメッセージを取得
	 */
	this.getErrors = function(){
		return _pjError;
	}

	/**
	 * エラーメッセージを消去
	 */
	this.clearErrors = function(){
		_pjError = [];
		return true;
	}

	// オブジェクトを初期化
	init(this);
	return this;

};
