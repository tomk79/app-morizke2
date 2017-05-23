(function(){
	window.px = window.parent.px;
	var systemInfoCollector = new (require('../../../mods/systeminfo/index_files/libs.ignore/system.js'))(window.px);
	var applicationInfoCollector = new (require('../../../mods/systeminfo/index_files/libs.ignore/application.js'))(window.px);
	var tableTemplate;

	$(window).load( function(){
		px.it79.fnc({}, [
			function(it1, arg){
				console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= System Info =-=-=-=-=-=');
				console.log('------------------- px', px);
				console.log('------------------- process', px.process);
				console.log('------------------- window', window.parent);
				tableTemplate = $('#template-table').html();
				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// ボタンアクション設定： フィードバック送信
				$('.cont_support-page-link button')
					.on('click', function(){
						px.utils.openURL( px.packageJson.pickles2.forum.url );
						return false;
					})
					.text(px.packageJson.pickles2.forum.title + ' ページへ、フィードバックを投稿してください。')
				;

				// --------------------------------------
				// ボタンアクション設定： 設定データフォルダを開く
				$('.cont_open-data-dir button')
					.on('click', function(){
						px.openDataDir();
						return false;
					})
				;

				it1.next();
			},
			function(it1, arg){
				// --------------------------------------
				// アプリケーション情報テーブル描画
				applicationInfoCollector.getInfo(function(result){
					var html = px.utils.bindEjs(
						tableTemplate,
						{
							"info": result
						}
					);
					$('.cont_application-information-table').html( html );
					it1.next();
				});

			},
			function(it1, arg){
				// --------------------------------------
				// システム情報テーブル描画
				systemInfoCollector.getInfo(function(result){
					var html = px.utils.bindEjs(
						tableTemplate,
						{
							"info": result
						}
					);
					$('.cont_system-information-table').html( html );
					it1.next();
				});

			},
			function(it1, arg){
				console.log('system info done.');
				it1.next();
			}
		]);

	} );

})();
