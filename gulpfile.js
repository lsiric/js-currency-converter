var MODULE_NAME = require('./package.json').name
	PATHS = {
		jquery: './node_modules/jquery/dist/jquery.js',
		js: './src/**/*.js',
		demo: './demo',
		build: './build',
		eslintConfigFile: '.eslintrc'
	},
	gulp = require('gulp'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify'),
	fs = require('fs'),
	eslint = require('gulp-eslint'),
	exec = require('child_process').exec,
	karmaServer = require('karma').Server;

// Build tasks
gulp.task('eslint', function () {
	return gulp.src(PATHS.js)
		.pipe(eslint({
			configFile: PATHS.eslintConfigFile
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('scripts', [/*'eslint'*/], function() {  
	return gulp.src([PATHS.js])
		.pipe(concat(MODULE_NAME + '.js'))
		.pipe(gulp.dest(PATHS.build))
		.pipe(rename(MODULE_NAME + '.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest(PATHS.build));
});

gulp.task('test', function (done) {
	new karmaServer({
		configFile: __dirname + '/karma.config.js'
	}, done).start();
});

gulp.task('build', ['scripts'/*, 'test'*/]);

gulp.task('docs', function () {
	return exec('jsdoc ./src -d ./docs');
});

// Demo tasks
gulp.task('create-demo-index', function(done){
	var indexHtml = '<!DOCTYPE html><html><head> <title>js-currency-converter Demo</title> <script type="text/javascript" src="jquery.js"></script> <script type="text/javascript" src="js-currency-converter.js"></script></head><body style="font-size: 38px;"> <h4>Converting 100 EUR to USD</h4> <p>100 EUR = <span id="converted1"></span> USD</p> <h4>USD to EUR conversion rate</h4> <p>USD to EUR = <span id="converted2"></span></p> <h4>USD to EUR conversion rate from cache</h4> <p>USD to EUR = <span id="converted3"></span></p> <script type="text/javascript"> var converter = CurrencyConverter({ API: { url: \'/convert\' } }); converter.convertAmount(100, \'USD_EUR\', \'EUR_USD\').done(function(response) { document.getElementById(\'converted1\').innerHTML = response[\'USD_EUR\'].amount; }).fail(function(error) { console.error(error); }); converter.fetchQuote(\'USD_EUR\', \'EUR_USD\').done(function(response) { document.getElementById(\'converted2\').innerHTML = response[\'USD_EUR\'].val; }).fail(function(error) { console.error(error); }); converter.getRate(\'USD_EUR\').done(function(response) { document.getElementById(\'converted3\').innerHTML = response[\'USD_EUR\'].val; }).fail(function(error) { console.error(error); }); </script></body></html>';
	if (!fs.existsSync(PATHS.demo)) {
		fs.mkdirSync(PATHS.demo);
	};
  	fs.writeFile(PATHS.demo +  '/index.html', indexHtml, done);
});

gulp.task('demo-build', ['build', 'create-demo-index'], function () {
	return gulp.src([PATHS.jquery, PATHS.build + '/' + MODULE_NAME + '.js'])
		.pipe(gulp.dest(PATHS.demo));
});

gulp.task('demo', ['demo-build'], function () {
	exec(' http-server ./demo -p 8080 --cors -P \'http://free.currencyconverterapi.com/api/v3\' -o -c-1');
});

// Default task
gulp.task('default', ['build']);