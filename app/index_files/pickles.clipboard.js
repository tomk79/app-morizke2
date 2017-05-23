(function(px, $){
	var clipboard = '';

	/**
	 * クリップボード管理オブジェクト
	 */
	px.clipboard = new (function(){

		// clipboardに値をセットする
		this.set = function( text ){
			clipboard = text;

			var copyArea = $("<textarea/>");
			copyArea.text(text);
			$("body").append(copyArea);
			copyArea.select();
			document.execCommand("copy");
			copyArea.remove();
			return this;
		}// px.clipboard.set();

		// clipboardから値を取得する
		this.get = function(){
			var copyArea = $("<textarea/>");
			$("body").append(copyArea);
			copyArea.select();
			document.execCommand("paste");
			var rtn = copyArea.text();
			copyArea.remove();

			if( typeof(rtn) !== typeof('') || !rtn.length ){
				rtn = clipboard;
			}
			return rtn;
		}// px.clipboard.get();

	})();

})(px, jQuery);