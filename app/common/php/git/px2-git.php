<?php

require_once(__DIR__.'/../../../../vendor/autoload.php');

class px2git{
	/** px2-git object */
	private $px2git;

	/** method */
	private $method;

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
		$this->command_git = @$arg->command_git;
		$this->method = @$arg->method;
		$this->options = @$arg->options;
		if( !is_array($this->options) ){
			$this->options = array();
		}
		$this->px2git = new \tomk79\pickles2\git\main(
			$this->entryScript,
			array(
				'bin' => $this->command_git
			)
		);
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
		$result = '';
		switch( $this->method ){
			case 'status':
			case 'status_contents':
			case 'commit_sitemaps':
			case 'commit_contents':
			case 'log':
			case 'log_contents':
			case 'log_sitemaps':
			case 'show':
			case 'rollback_sitemaps':
			case 'rollback_contents':
				$result = call_user_func_array(
					array($this->px2git, $this->method),
					$this->options
				);
				return $result;
				break;
		}
		return $result;
	}
}



$obj = new px2git();
$rtn = $obj->execute();
@header('Content-type: application/json');
print json_encode($rtn);
exit();
