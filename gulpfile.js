var MODULE_NAME = require('./package.json').name,
	VERSION = require('./package.json').version,
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
	eslint = require('gulp-eslint'),
	exec = require('child_process').exec,
	karmaServer = require('karma').Server;

gulp.task('scripts', ['eslint'], function() {  
	return gulp.src([PATHS.js])
		.pipe(concat(MODULE_NAME + '.js'))
		.pipe(gulp.dest(PATHS.build))
		.pipe(rename(MODULE_NAME + '.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest(PATHS.build));
});

gulp.task('build', ['scripts'], function () {
	console.log(MODULE_NAME, 'built');
});

gulp.task('eslint', function () {

	return gulp.src(PATHS.js)
		.pipe(eslint({
			configFile: PATHS.eslintConfigFile
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());

});

gulp.task('test', function (done) {
	new karmaServer({
		configFile: __dirname + '/karma.config.js'
	}, done).start();
});

gulp.task('demo-build', ['build'], function () {
	return gulp.src([PATHS.jquery, PATHS.build + '/' + MODULE_NAME + '.js'])
		.pipe(gulp.dest(PATHS.demo));
});

gulp.task('demo', ['demo-build'], function () {
	exec(' http-server ./demo -p 8080 --cors -P \'http://free.currencyconverterapi.com/api/v3\' -o -c -1');
});

gulp.task('default', ['build']);