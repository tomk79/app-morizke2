/**
 * contentsComment.js
 */
module.exports = function(app, px, pj){
	var _this = this;
	var realpath_comment_file;
	var pageInfo;
	var $commentView;

	/**
	 * 初期化
	 */
	this.init = function( _pageInfo, _$commentView ){
		pageInfo = _pageInfo;
		$commentView = _$commentView;

		var pathFiles = pj.getContentFilesByPageContent(
			pj.findPageContent( pageInfo.path )
		);
		var realpathFiles = pj.get_realpath_controot()+pathFiles;
		var realpath_matDir = realpathFiles + 'comments.ignore/';
		realpath_comment_file = realpath_matDir + 'comment.md';

		$commentView
			.html('...')
			.attr({'data-path': pageInfo.path})
			.off('dblclick')
			.on('dblclick', function(){
				_this.editComment();
				return false;
			})
		;


		setTimeout(function(){
			_this.updateComment();
		}, 10);

		return;
	}

	/**
	 * コメントを編集する
	 * @return {[type]} [description]
	 */
	this.editComment = function(){
		var $body = $('<div>');
		var $textarea = $('<textarea class="form-control">');
		var $preview = $('<div>');
		$body
			.append( $('<div>')
				.css({
					'display': 'flex',
					'height': '450px',
					'margin': '1em 0'
				})
				.append($textarea.css({
					'width': '50%',
					'height': '100%',
					'overflow': 'auto'
				}))
				.append($preview.css({
					'width': '50%',
					'height': '100%',
					'overflow': 'auto',
					'padding': '20px'
				}))
			)
		;

		function update(){
			var src = $textarea.val();
			var html = px.utils.markdown( src );
			var $html = $('<div>').html(html);
			$html.find('a[href]').on('click', function(){
				px.utils.openURL(this.href);
				return false;
			});
			$preview.html($html);
		}
		$textarea.on('change keyup', function(){
			update();
		});

		px.fs.readFile(realpath_comment_file, {'encoding':'utf8'}, function(err, data){
			$textarea.val(data);
			update();

			px.dialog({
				'title': 'コンテンツコメントを編集',
				'body': $body,
				'buttons':[
					$('<button>')
						.text('OK')
						.addClass('px2-btn--primary')
						.on('click', function(){
							var val = $body.find('textarea').val();
							px.fs.writeFileSync( realpath_comment_file, val );

							_this.updateComment(function(){
								px.closeDialog();
							});
						}),
					$('<button>')
						.text('Cancel')
						.on('click', function(){
							px.closeDialog();
						})
				]
			});

		});
		return;
	}

	/**
	 * コメント表示欄を更新する
	 * @return {[type]} [description]
	 */
	this.updateComment = function(callback){
		callback = callback || function(){};
		if(!px.utils.isFile( realpath_comment_file )){
			$commentView.text('no comment.');

			callback(true);
			return;
		}
		$commentView.text('コメントをロードしています...');
		px.fs.readFile(realpath_comment_file, {'encoding':'utf8'}, function(err, data){
			var html = px.utils.markdown( data );
			var $html = $('<div>').html(html);
			$html.find('a[href]').on('click', function(){
				px.utils.openURL(this.href);
				return false;
			});
			$commentView.html($html);

			callback(true);
		});
		return;
	}

	return;
}
