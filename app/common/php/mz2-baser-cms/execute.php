<?php
/**
 * mz2-baser-cms を実行する
 */
require_once(__DIR__.'/../../../../vendor/autoload.php');

class mz2BaserCms{
	/** path_output_zip */
	private $path_output_zip;

	/** options */
	private $options;

	/** entryScript path */
	private $entryScript;

	/**
	 * constructor
	 */
	public function __construct(){
		$this->tune_php();

		// var_dump($_SERVER['argv']);
		$count = count($_SERVER['argv']);
		// var_dump($count);
		$count = $count-1;
		// var_dump($count);
		$arg = $_SERVER['argv'][$count];
		$arg = base64_decode( $arg );
		$arg = json_decode( $arg );
		// var_dump($arg);

		$this->entryScript = @$arg->entryScript;
		$this->path_output_zip = @$arg->path_output_zip;
		$this->options = @$arg->options;
		if( !is_array($this->options) ){
			$this->options = array();
		}
	}

	/**
	 * PHPを調整
	 */
	private function tune_php(){
		if( !extension_loaded( 'mbstring' ) ){
			trigger_error('mbstring not loaded.');
		}
		if( is_callable('mb_internal_encoding') ){
			mb_internal_encoding('UTF-8');
			@ini_set( 'mbstring.internal_encoding' , 'UTF-8' );
			@ini_set( 'mbstring.http_input' , 'UTF-8' );
			@ini_set( 'mbstring.http_output' , 'UTF-8' );
		}
		@ini_set( 'default_charset' , 'UTF-8' );
		if( is_callable('mb_detect_order') ){
			@ini_set( 'mbstring.detect_order' , 'UTF-8,SJIS-win,eucJP-win,SJIS,EUC-JP,JIS,ASCII' );
			mb_detect_order( 'UTF-8,SJIS-win,eucJP-win,SJIS,EUC-JP,JIS,ASCII' );
		}
		@header_remove('X-Powered-By');
	}

	/**
	 * px2-git を実行する
	 * @return void no return.
	 */
	public function execute(){
		$mz2basercms = new \tomk79\pickles2\mz2_baser_cms\main( $this->entryScript );
		$res = $mz2basercms->export( $this->path_output_zip );
		return $res;
	}
}



$obj = new mz2BaserCms();
$rtn = $obj->execute();
@header('Content-type: application/json');
print json_encode($rtn);
exit();
