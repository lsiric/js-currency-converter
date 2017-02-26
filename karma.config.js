module.exports = function(config) {
	config.set({
		frameworks: ['jasmine'],
		browsers: ['PhantomJS'],
		reporters: ['progress', 'coverage'],
		preprocessors: {
			'src/**/*.js': 'coverage'
		},
		files: [
			'node_modules/jquery/dist/jquery.js',
			'src/**/*.js',
			'spec/tests/**/*.js'
		],
		plugins: [
			'karma-jasmine',
			'karma-coverage',
			'karma-phantomjs-launcher'
		],
		port: 9876,
		colors: true,
		autoWatch: true,
		singleRun: false,
		coverageReporter: {
			type : 'html',
			dir : 'spec/coverage/'
		}
	});
}
