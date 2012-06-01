var path = require("path"),
	glob = require("glob"),
	argv = require('optimist').argv,
	wrench = require("wrench"),
	program = require("commander"),
	DataURICommand = require("../commands/datauri.js");


var mapper,
	interceptor,
	ieCompat = true;
/**
 * plugin name
 */
exports.name = "datauri";

/**
 * plugin description
 */
exports.description = "datauri";

/**
 * plugin action
 */
var toPath = function(file){
	var p = path.resolve( __dirname + "/../tmp/" + file),
		dirname = path.dirname(p),
		basename = path.basename(p);
	
	if(mapper && mapper.transform){
		p = mapper.transform(file, p);
	}
	if(!path.existsSync(dirname)){
		try{
			wrench.mkdirSyncRecursive(dirname, 0777);
		}catch(err){}
	}
	return p;
};

var datauriFile = function(file, callback){
	var toName = toPath(file);
	DataURICommand.execute({
		from: file,
		to: toName,
		ieCompat: ieCompat
	}, function(err){
		if(err){
			console.log("Error occur while handling file: " + file);
			console.log(err);
		}else{
			console.log("DataURI success at file: " + file);
		}
		callback && callback(err);
		if(interceptor){
			interceptor.execute(toName);
		}
	});
};


exports.initialize = function(options){
	if(options.interceptor){
		interceptor = require(__dirname + "/../" + options.interceptor);
	}
	if(options.mapper){
		mapper = require(__dirname + "/../" + options.mapper);
	}
	if(options.ieCompat !== undefined){
		ieCompat = options.ieCompat;
	}
};

exports.action = function(){
	var query = process.argv[3],
		silent = argv.s || argv.silent;
	
	if(argv.n !== undefined || argv.nocompat !== undefined){
		ieCompat = false;
	}
		
	if(!query){
		return console.log("the file glob is required");
	}
	glob(query, function(err, files){
		if(silent){
			files.forEach(function(file){
				datauriFile(file);
			});
		}else{
			AttUtil.doSequenceTasks(files, function(file, callback){
				program.confirm("datauri the file -> " + file + " ? ", function(yes){
					if(yes){
						datauriFile(file, callback);
					}else{
						callback();
					}
				});
			},function(){
				process.stdin.destroy();
			});
		}
	});
};