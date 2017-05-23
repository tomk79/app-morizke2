/**
 * Publish: app.progressReport.js
 */
window.contApp.progressReport = new (function(px, $){
	var _this = this;
	var _pj = px.getCurrentProject();
	var $results, $phase, $currentTask, $timer, $row, $progressBar;
	var _timer;

	/**
	 * レポート表示の初期化
	 */
	this.init = function( contApp, $canvas, opts ){
		px.progress.start();

		$results = $( $('#template-before_publish-progress').html() );
		$timer = $results.find('.cont_progress-timer');
		$row = $results.find('.cont_progress-row');
		$phase = $results.find('.cont_progress-phase').css({'font-weight':'bold'});
		$currentTask = $results.find('.cont_progress-currentTask');
		$progressBar = $results.find('.cont_progress-bar [role=progressbar]');
		$canvas.html('').append( $results );


		var phase;

		// console.log(opts);

		_pj.px2proj.publish({
			"path_region": opts.path_region,
			"paths_region": opts.paths_region,
			"paths_ignore": opts.paths_ignore,
			"keep_cache": opts.keep_cache,
			"success": function(data){
				// console.log(data);
				try {
					var data = data.toString();
					var rows = data.split(new RegExp('(\r\n|\r|\n)+'));
				} catch (e) {
				}
				for( var idx in rows ){
					var row = px.php.trim( rows[idx] );
					if( typeof(row) !== typeof('') || !row.length ){
						continue;
					}
					if( row.match( new RegExp('^\\#\\#([\\s\\S]+)$') ) ){
						phase = px.php.trim( RegExp.$1 );
						if( phase == 'Start publishing' ){
							$phase.text( 'Publishing...' );
							(function(){
								var startTimestamp = (new Date).getTime();
								function updateTimer(){
									var time = (new Date).getTime() - startTimestamp;
									$timer.text( Math.floor(time/1000) + ' sec' );
									_timer = setTimeout( updateTimer, 25 );
								}
								updateTimer();
							})();
						}else{
							$phase.text( phase );
						}
					}else if( phase == 'Start publishing' ){
						if( row.match( new RegExp('^([0-9]+)\\/([0-9]+)$') ) ){
							$currentTask.text( RegExp.$1 +' / '+ RegExp.$2 );
							var per = RegExp.$1/RegExp.$2*100;
							$progressBar.attr({'aria-valuenow':per}).css({'width':per+'%'});
						}else if( row.match( new RegExp('^\\/([\\s\\S]+)$') ) ){
							$row.text(row);
						}
					}else if( phase == 'Clearing caches' ){
						$row.text(row);
					}else if( phase == 'Making list' ){
						$row.text(row);
					}else{
						$row.text('');
					}
					// console.log( row );
				}
			},
			"complete":function(data){
				// console.log(data);
				clearTimeout(_timer);
				setTimeout(function(){
					px.progress.close();
					opts.complete(true);
				}, 3000);
			}
		});

	}// this.init();


	return this;

})(px, $);
