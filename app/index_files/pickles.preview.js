(function(px){
	var _previewServer = require('./index_files/px_server_emulator.node.js').init(px);
	px.preview = new (function(){
		this.getUrl = function( path ){

			var port = this.getPort();

			if( typeof(path) !== typeof('') ){ path = ''; }
			if( !path.length ){ path = '/'; }
			path = path.replace( new RegExp('^\\/+'), '' );
			path = path.replace( new RegExp('\\{(?:\\*|\\$)[\s\S]*\\}'), '' );

			var pj = px.getCurrentProject();
			var croot = '/';
			if( pj && pj.getConfig() ){
				croot = pj.getConfig().path_controot;
				croot = croot.replace( new RegExp('^\\/+'), '' );
				croot = croot.replace( new RegExp('\\/+$'), '/' );
			}
			var croot_path = croot+path;
			croot_path = croot_path.replace( /^\/+/, '' );

			// 外部プレビューサーバーの設定があれば、それを優先
			if( pj ){
				var px2dtLDA_Pj = px.px2dtLDA.project(pj.projectId);
				var external_preview_server_origin = px2dtLDA_Pj.getExtendedData('external_preview_server_origin');
				if( typeof(external_preview_server_origin)==typeof('') && external_preview_server_origin.match(/^https?\:\/\//i) ){
					external_preview_server_origin = external_preview_server_origin.replace( /\/+$/, '' );
					var url = external_preview_server_origin+'/'+croot_path;
					return url;
				}
			}

			// デフォルト：内蔵プレビューサーバーの設定を返却
			var url = 'http://127.0.0.1:'+port+'/'+croot_path;

			return url;
		}

		/**
		 * ポート番号を取得
		 */
		this.getPort = function(){
			var port = px.packageJson.pickles2.network.preview.port;
			var db = px.getDb();
			if( db.network && db.network.preview && db.network.preview.port ){
				port = db.network.preview.port;
			}
			return port;
		}

		/**
		 * サーバーを起動
		 */
		this.serverStandby = function( cb ){
			_previewServer.start(this.getPort(), cb);
			return this;
		}

	})();

})(px);
