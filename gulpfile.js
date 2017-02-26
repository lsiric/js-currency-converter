var MODULE_NAME = require('./package.json').name,
	PATHS = {
		js: './src/**/*.js',
		build: './build',
		eslintConfigFile: '.eslintrc'
	},
	gulp = require('gulp'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify'),
	eslint = require('gulp-eslint')
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

gulp.task('default', ['build']);