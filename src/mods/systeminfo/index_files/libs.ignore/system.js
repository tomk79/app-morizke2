/**
 * system.js
 */
module.exports = function(px){
	var _this = this;

	this.getInfo = function(callback){
		callback = callback || function(){};
		var systemInfo = [];

		px.it79.fnc({}, [
			function(it1, arg){
				// --------------------------------------
				// 情報収集: User name
				px.utils.exec(
					'whoami',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'User name', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: PHP Version
				px.utils.exec(
					px.cmd('php') + ' -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'PHP version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: PHP path
				px.utils.exec(
					(px.cmd('php')=='php'?'which '+px.cmd('php'):'echo '+px.cmd('php')),
					function(err,stdout,stderr){
						systemInfo.push({'label': 'PHP path', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: composer version
				px.utils.exec(
					px.cmd('php') + ' ' + px.cmd('composer') + ' --version',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'composer version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: git version
				px.utils.exec(
					px.cmd('git') + ' --version',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'git version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: git path
				px.utils.exec(
					(px.cmd('git')=='git'?'which '+px.cmd('git'):'echo '+px.cmd('git')),
					function(err,stdout,stderr){
						systemInfo.push({'label': 'git path', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: node version
				px.utils.exec(
					'node -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'node version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				// --------------------------------------
				// 情報収集: npm version
				px.utils.exec(
					'npm -v',
					function(err,stdout,stderr){
						systemInfo.push({'label': 'npm version', 'value': stdout});
						it1.next();
					}
				);

			},
			function(it1, arg){
				callback(systemInfo);
			}
		]);

		return;
	}

	return;
}
