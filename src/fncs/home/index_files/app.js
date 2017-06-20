window.px = window.parent.px;
window.contApp = new (function(){
	var _this = this;
	var pj = px.getCurrentProject();
	this.pj = pj;
	var status = pj.status();
	var it79 = require('iterate79');
	var $mainTaskUi;

	/**
	 * initialize
	 */
	function init(){
		var px2dtLDA_pj = px.px2dtLDA.project(pj.projectId);

		it79.fnc({}, [
			function(it, arg){
				$mainTaskUi = $('.cont_maintask_ui');
				$('.tpl_name').text( pj.get('name') );
				$('address.center').text( px.packageJson.pickles2.credit );
				it.next(arg);
			} ,
			function(it, arg){
				_this.pageStart(function(){
					it.next(arg);
				});
			} ,
			function(it, arg){
				console.log('standby');
			}
		]);

	}// init()


	/**
	 * 最初の画面を表示する
	 */
	this.pageStart = function(callback){
		callback = callback || function(){};

		if( !status.isPxStandby ){
			// 準備ができていない
			_this.pageNotReady(callback);
			return;
		}

		// ちゃんとインストールできてます
		var tpl = $('#template-standby').html();
		tpl = px.utils.bindEjs(tpl, {
			'exportMenu': [
				{
					'label': 'Wordpress',
					'targetSystemName': 'wordpress'
				},
				{
					'label': 'baserCMS',
					'targetSystemName': 'basercms'
				},
				{
					'label': 'AEM',
					'targetSystemName': 'aem'
				}
			]
		}, {});
		$mainTaskUi
			.html( tpl )
		;
		$mainTaskUi.find('button').on('click', function(e){
			var $this = $(this);
			var systemName = $this.attr('data-target-system-name');
			// alert( $this.attr('data-target-system-name') );
			_this.pageConfig(systemName, function(){
				console.log('done.');
			});
		});

		callback();
		return;
	}


	/**
	 * 設定画面を表示する
	 */
	this.pageConfig = function(systemName, callback){
		callback = callback || function(){};

		if( !status.isPxStandby ){
			// 準備ができていない
			_this.pageNotReady(callback);
			return;
		}

		// ちゃんとインストールできてます
		var tpl = $('#template-page-config').html();
		tpl = px.utils.bindEjs(tpl, {
			'targetSystemName': systemName
		}, {});
		$mainTaskUi
			.html( tpl )
		;
		$mainTaskUi.find('form.cont-form-execute').on('submit', function(e){
			var $this = $(this);
			alert( $this.find('input[name=target-system-name]').val() );
		});
		$mainTaskUi.find('.cont-btn-cancel').on('click', function(e){
			_this.pageStart();
		});


		callback();
		return;
	}


	/**
	 * 準備ができていません画面を表示する
	 */
	this.pageNotReady = function(callback){
		callback = callback || function(){};
		$mainTaskUi
			.html( $('#template-not-ready').html() )
		;

		var errors = pj.getErrors();
		if( errors.length ){
			var $errors = $('<div class="selectable">');
			for( var idx in errors ){
				$errors.append( $('<pre>').append( $('<code>').text( errors[idx].message ) ) );
			}
			$mainTaskUi.append( $errors );
		}

		callback();
		return;
	}


	/**
	 * イベント
	 */
	$(function(){
		init();
	});

})();
