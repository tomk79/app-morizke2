/**
 * Publish: app.resultReport.js
 */
window.contApp.resultReport = new (function(px, $){
	var _this = this;

	var $results, $rows, $summaries, $spentTime, $totalFileCount, $errorMessage;

	/**
	 * レポート表示の初期化
	 */
	this.init = function( contApp, $canvas ){

		$results = $( $('#template-after_publish-canvas').html() );
		$canvas.append( $results );

		$rows = $results.find('.cont_results-rows');
		$summaries = $results.find('.cont_results-summaries');
		$spentTime = $results.find('.cont_results-spentTime span');
		$totalFileCount = $results.find('.cont_results-total_file_count strong');
		$errorMessage = $results.find('.cont_results-errorMessage');

		px.utils.iterateFnc([
			function( it, arg ){
				// d3.csv( contApp.getRealpathPublishDir()+"publish_log.csv", function(error, csv){
				// 	arg.publishLogCsv = csv;
				// 	it.next(arg);
				// });

				d3.csv( 'file://'+contApp.getRealpathPublishDir()+"publish_log.csv" )
					.row(function(d) {
						var rtn = {};
						rtn.datetime = d['datetime'];
						rtn.path = d['path'];
						rtn.procType = d['proc_type'];
						rtn.statusCode = d['status_code'];
						return rtn;
					})
					.get(function(error, csv) {
						// console.log(csv);
						arg.publishLogCsv = csv;
						it.next(arg);
					})
				;
			} ,
			function( it, arg ){
				var status = contApp.getStatus();
				arg.alertLogCsv = [];
				if( !status.alertLogExists ){
					it.next(arg);
					return;
				}
				d3.csv( 'file://'+contApp.getRealpathPublishDir()+"alert_log.csv" )
					.row(function(d) {
						var rtn = {};
						rtn.datetime = d['datetime'];
						rtn.path = d['path'];
						rtn.errorMessage = d['error_message'];
						return rtn;
					})
					.get(function(error, csv) {
						// console.log(csv);
						arg.alertLogCsv = csv;
						it.next(arg);
					})
				;
			} ,
			function( it, arg ){
				var status = contApp.getStatus();
				var count = arg.publishLogCsv.length;
				var startDateTime = arg.publishLogCsv[0].datetime;
				var endDateTime = arg.publishLogCsv[arg.publishLogCsv.length-1].datetime;
				var time = Date.parse( endDateTime ) - Date.parse( startDateTime );

				function updateTotalFileCounter( count, i ){
					i ++;
					var t = 50;
					if( t == i ){
						// 全量完了
						$totalFileCount.text( count );

						if( status.alertLogExists ){
							$results.addClass('cont_results-error');
							$errorMessage
								.text( arg.alertLogCsv.length + '件のエラーが検出されています。' )
							;
						}
						return;
					}
					$totalFileCount.text( Math.round(count/t*i) );
					setTimeout( function(){ updateTotalFileCounter( count, i ); }, 2 );
				}
				updateTotalFileCounter( count, 0 );

				function updateSpentTime( time, i ){
					i ++;
					var t = 35;
					if( t == i ){
						// 全量完了
						$spentTime.text( time + ' sec' );
						return;
					}
					$spentTime.text( Math.round(time/t*i) + ' sec' );
					setTimeout( function(){ updateSpentTime( time, i ); }, 4 );
				}
				updateSpentTime( (time/1000), 0 );


				var rows = [];
				var summaries = {
					'procTypes': {} ,
					'statusCodes': {}
				};
				// d3.select( $canvas.get(0) ).html(arg.publishLogCsv);

				px.utils.iterate(
					arg.publishLogCsv,
					function( it2, row2, idx2 ){

						// 行データ
						rows.push( row2 );
						(function(){
							return;// ← 開発中コメントアウト
							var li = d3.select( $rows.find('table').get(0) ).selectAll('tr');
							var update = li
								.data(rows)
								// .html(function(d, i){
								// 	return '<td>'+(i+1) + '</td><td>' + d['* path']+'</td>';
								// })
							;
							update.enter()
								.append('tr')
								.html(function(d, i){
									var html = '';
									html += '<th>'+(i+1) + '</th>';
									html += '<td>'+d.path+'</td>';
									html += '<td>'+d.procType+'</td>';
									html += '<td>'+d.statusCode+'</td>';
									return html;
								})
							;
							update.exit()
								.remove()//消す
							;
						})();



						// 統計
						if( !summaries.procTypes[row2.procType] ){ summaries.procTypes[row2.procType] = 0; };
						summaries.procTypes[row2.procType] ++;

						if( !summaries.statusCodes[row2.statusCode] ){ summaries.statusCodes[row2.statusCode] = 0; };
						summaries.statusCodes[row2.statusCode] ++;
						// console.log(summaries);

						(function(){
							var table = d3.select( $summaries.find('table').get(0) );
							table.select('tr.cont_procTypes td')
								.data([summaries.procTypes])
								.html(
									function(d, i){
										var ul = $('<ul>');
										for( var idx in d ){
											ul.append( $('<li>').text( idx + ': ' + d[idx] ) );
										}
										return ul.html();
									}
								)
							;
							table.select('tr.cont_statusCodes td')
								.data([summaries.statusCodes])
								.html(
									function(d, i){
										var ul = $('<ul>');
										for( var idx in d ){
											ul.append( $('<li>').text( idx + ': ' + d[idx] ) );
										}
										return ul.html();
									}
								)
							;
						})();

						setTimeout( function(){
							it2.next();
						}, 0 );

					} ,
					function(){
						it.next(arg);
					}
				);

			}
		]).start({});

	}// this.init();



	return this;
})(px, $);
