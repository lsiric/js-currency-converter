describe('CurrencyConverter', function() {
	'use strict';

	var toQuery = function (fromCurrency, toCurrency) {
		return (fromCurrency || '') + '_' + (toCurrency || '');
	}

	var converter = null;
	var jQuery = window.$;
	var defaultOptions = {
		RATES_VALIDITY_HOURS : 24,
		CACHE_TO_LOCAL_STORAGE : false,
		LOCAL_STORAGE_VARIABLE_NAME: 'JS_CURRENCY_CONVERTER_CACHED_RATES',
		API: {
			url: 'http://free.currencyconverterapi.com/api/v3/convert',
			queryParams: {
				compact: 'y',
				apiKey: ''
			}
		}
	};

	// TEST DATA
	var fromRate = 'EUR',
		toRate = 'USD',
		query = toQuery(fromRate, toRate),
		errorResponse = 'ERROR',
		serverResponse = {
			'EUR_USD': {
				val: 1
			}
		},
		rate = {
			expired: false,
			rate: 1
		};

	beforeEach(function () {
		converter = window.CurrencyConverter(defaultOptions);
		localStorage.clear();
	});

	describe('getConfig', function () {

		it('should return default options', function() {
			expect(converter.getConfig()).toEqual(defaultOptions);
		});

		it('should return overriden options', function() {
			var overrides = {
				RATES_VALIDITY_HOURS: 5,
				CACHE_TO_LOCAL_STORAGE: false, 
				LOCAL_STORAGE_VARIABLE_NAME: 'RANDOM_NAME', 
				API: {
					url: '',
					params: {
						compact: 'n',
						apiKey: '123123'
					}
				}
			};
			converter.config(overrides);
			expect(converter.getConfig()).toEqual(overrides);
		});

	});

	describe('setConfig', function () {

		it('should override default options', function() {
			var overrides = {
				RATES_VALIDITY_HOURS: 5,
				CACHE_TO_LOCAL_STORAGE: false, 
				LOCAL_STORAGE_VARIABLE_NAME: 'RANDOM_NAME', 
				API: {
					url: '',
					params: {
						compact: 'n',
						apiKey: '123123'
					}
				}
			};
			converter.config(overrides);
			expect(converter.getConfig()).toEqual(overrides);
		});

		it('should add new testSetting attribute to existing settings', function() {
			var overrides = {
				testSetting: 'random string'
			};
			var overridenOptions = jQuery.extend({}, defaultOptions, overrides);

			converter.config(overrides);
			expect(converter.getConfig()).toEqual(overridenOptions);
		});

		it('should not override non existing fields', function() {
			var overrides = {};
			converter.config(overrides);
			expect(converter.getConfig()).toEqual(defaultOptions);
		});

		it('should not override non objects', function() {
			var overrides = 'overrides';
			converter.config(overrides);
			expect(converter.getConfig()).toEqual(defaultOptions);
		});

	});

	describe('convertAmount', function () {

		it('should return amount, rate and expired flag', function (done) {
			var rate = {
				expired: false,
				rate: 1
			};
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().resolve(rate));

			converter.convertAmount(100, 'EUR', 'USD').done(function (result) {
				expect(result.expired).toEqual(false);
				expect(result.rate).toEqual(1);
				expect(result.value).toEqual(100);
				done();
			});
		});

		it('should successfuly convert 100USD to EUR', function (done) {
			var rate = {
				expired: false,
				rate: 0.9
			};
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().resolve(rate));

			converter.convertAmount(100, 'USD', 'EUR').done(function (result) {
				expect(result.value).toEqual(90);
				done();
			});
		});

		it('should successfuly convert 100USD to 50EUR', function (done) {
			var rate = {
				expired: false,
				rate: 0.5
			};
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().resolve(rate));

			converter.convertAmount(100, 'EUR', 'USD').done(function (result) {
				expect(result.value).toEqual(50);
				done();
			});
		});

		it('should reject promise on conversion error', function (done) {
			var error = 'CONVERSION ERROR';
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().reject(error));

			converter.convertAmount(100, 'EUR', 'USD').fail(function (er) {
				expect(er).toEqual(error);
				done();
			});
		});

	});

	describe('fetchQuote', function () {

		it('should cache API calls in progress', function () {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));

			var callInProgress = converter.fetchQuote(fromRate, toRate);

			expect(converter.getConversionInProgress(query)).toBe(callInProgress);
		});

		it('should return API calls in progress', function () {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));
			converter.fetchQuote(fromRate, toRate);
			var callInProgress = converter.fetchQuote(fromRate, toRate);

			expect(converter.getConversionInProgress(query)).toBe(callInProgress);
		});

		it('should call default API.url with EUR_USD query', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));

			converter.fetchQuote(fromRate, toRate).done(function (result) {
				expect(jQuery.get).toHaveBeenCalledWith(converter.buildUrl({q:query}));
				done();
			});
		});

		it('should return conversion rate 1', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));

			converter.fetchQuote(fromRate, toRate).done(function (result) {
				expect(result).toEqual(1);
				done();
			});
		});

		it('should reject promise on API conversion error', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().reject(errorResponse));

			converter.fetchQuote(fromRate, toRate).fail(function (error) {
				expect(error).toEqual(errorResponse);
				done();
			});
		});

	});

	describe('getRate', function () {

		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.clear();
		});

		it('should resolve a rate object with "expired" and "rate" properties', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));

			converter.getRate(fromRate, toRate).done(function (result) {
				expect(result.expired).toEqual(false);
				expect(result.rate).toEqual(1);
				done();
			});
		});

		it('should resolve a fresh new rate from the server', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));

			converter.getRate(fromRate, toRate).done(function (result) {
				expect(jQuery.get).toHaveBeenCalled();
				expect(result).toEqual(rate);
				done();
			});
		});

		it('should resolve a cached rate', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(serverResponse));
			// cache rate
			converter.cacheRate(query, serverResponse[query].val, new Date());
			converter.getRate(fromRate, toRate).done(function (result) {
				expect(jQuery.get).not.toHaveBeenCalled();
				expect(result).toEqual(rate);
				done();
			});
		});

		it('should resolve an expired cached rate on api error', function (done) {
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().reject(errorResponse));
			// set cached rate as expired
			converter.cacheRate(query, serverResponse[query].val, new Date('11/11/2000'));

			converter.getRate(fromRate, toRate).done(function (result) {
				expect(jQuery.get).toHaveBeenCalled();
				expect(result).toEqual({
					expired: true,
					rate: 1
				});
				done();
			});
		});

		it('should resolve error if api fails and no rate is cached', function (done) {

			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().reject(errorResponse));

			converter.getRate(fromRate, toRate).fail(function (result) {
				expect(jQuery.get).toHaveBeenCalled();
				expect(result).toEqual(errorResponse);
				done();
			});
		});

	});


	describe('getConversionInProgress', function () {

		var rateName = 'RANDOM_RATE';
		var rateValue = 'RANDOM_VALUE';
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
		});

		it('should return no conversion in progress', function () {
			expect(converter.getConversionInProgress(rateName)).toBeUndefined();
		});

		it('should return conversion in progress', function () {
			converter.setConversionInProgress(rateName, rateValue)
			expect(converter.getConversionInProgress(rateName)).toEqual(rateValue);
		});

	});

	describe('setConversionInProgress', function () {

		var rateName = 'RANDOM_RATE';
		var rateValue = 'RANDOM_VALUE';
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
		});

		it('should set conversion in progress', function () {
			converter.setConversionInProgress(rateName, rateValue)
			expect(converter.getConversionInProgress(rateName)).toEqual(rateValue);
		});

	});

	describe('isConversionInProgress', function () {

		var rateName = 'RANDOM_RATE';
		var rateNameTwo = 'RANDOM_RATE_TWO';
		var rateValue = 'RANDOM_VALUE';
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
		});

		it('should return true for conversion in progress', function () {
			converter.setConversionInProgress(rateName, rateValue)
			expect(converter.isConversionInProgress(rateName)).toEqual(true);
		});

		it('should return false for conversion not in progress', function () {
			converter.setConversionInProgress(rateName, rateValue)
			expect(converter.isConversionInProgress(rateNameTwo)).toEqual(false);
		});

	});

	describe('cacheToLocalStorage', function () {

		var variableName = 'RANDOM_NAME';
		var rateName = 'RANDOM_RATE';
		var rate = {};
		rate[rateName] = {
			value : 0.5,
			date : new Date('11/11/2011')
		};
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.clear();
		});

		it('should cache CurrencyConverter rate cache object to local storage', function () {
			// save to cache object
			converter.cacheRate(rateName, rate[rateName].value, rate[rateName].date);
			// save to local storage
			converter.cacheToLocalStorage();

			expect(JSON.parse(localStorage.getItem(defaultOptions.LOCAL_STORAGE_VARIABLE_NAME))).toEqual({
				RANDOM_RATE: { 
					value: rate[rateName].value, 
					date: rate[rateName].date.toISOString()
				}
			});
		});

	});

	describe('cacheFromLocalStorage', function () {

		var variableName = 'RANDOM_NAME';
		var rateName = 'RANDOM_RATE';
		var rate = {};
		rate[rateName] = {
			value : 0.5,
			date : new Date('11/11/2011')
		};
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.clear();
		});

		it('should cache CurrencyConverter rate cache from local storage', function () {
			// instantiate converter which will cache rates to local storage
			converter = window.CurrencyConverter({
				CACHE_TO_LOCAL_STORAGE: true
			});

			// cache to local storage
			converter.cacheRate(rateName, rate[rateName].value, rate[rateName].date);

			// new instance of the converter which will cache rates to local storage
			converter = window.CurrencyConverter({
				CACHE_TO_LOCAL_STORAGE: true
			});

			expect(converter.getRateFromCache(rateName)).toEqual({
				value: rate[rateName].value, 
				date: rate[rateName].date.toISOString()
			});

		});

	});

	describe('isRateCached', function () {
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.setItem(defaultOptions.LOCAL_STORAGE_VARIABLE_NAME, null);
		});

		it('should return false for non cached rate', function () {
			expect(converter.isRateCached('EUR_USD')).toEqual(false);
		});

		it('should return true for cached rate', function () {
			converter.cacheRate('EUR_USD', 1, new Date());
			expect(converter.isRateCached('EUR_USD')).toEqual(true);
		});

	});

	describe('isDateExpired', function () {

		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.setItem(defaultOptions.LOCAL_STORAGE_VARIABLE_NAME, null);
		});

		it('should return true for date older than 1h', function () {
			converter = window.CurrencyConverter({ RATES_VALIDITY_HOURS: 1 });
			var date = new Date('11/11/2011');
			
			expect(converter.isDateExpired(date)).toEqual(true);
		});

		it('should return true for date older than 60h', function () {
			converter = window.CurrencyConverter({ RATES_VALIDITY_HOURS: 60 });
			var date = new Date('11/11/2011');
			
			expect(converter.isDateExpired(date)).toEqual(true);
		});

		it('should return false for date more recent than 24h', function () {
			converter = window.CurrencyConverter({ RATES_VALIDITY_HOURS: 24 });
			var date = new Date();
			date.setHours(date.getHours()-1);
			
			expect(converter.isDateExpired(date)).toEqual(false);
		});

	});

	describe('isRateCachedAndNonExpired', function () {

		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.setItem(defaultOptions.LOCAL_STORAGE_VARIABLE_NAME, null);
		});

		it('should return false for non cached rates', function () {
			expect(converter.isRateCachedAndNonExpired('EUR_USD')).toEqual(false);
		});

		it('should return false for expired cached rates', function () {
			converter = window.CurrencyConverter({ RATES_VALIDITY_HOURS: 1 });
			converter.cacheRate('EUR_USD', 1, new Date('11/11/2011'));

			expect(converter.isRateCachedAndNonExpired('EUR_USD')).toEqual(false);
		});

		it('should return true for non expired cached rates', function () {
			converter = window.CurrencyConverter({ RATES_VALIDITY_HOURS: 1 });
			converter.cacheRate('EUR_USD', 1, new Date());

			expect(converter.isRateCachedAndNonExpired('EUR_USD')).toEqual(true);
		});

	});

	describe('cacheRate', function () {

		var variableName = 'RANDOM_NAME';
		var rateName = 'RANDOM_RATE';
		var rate = {};
		rate[rateName] = {
			value : 0.5,
			date : new Date('11/11/2011')
		};

		beforeEach(function () {
			localStorage.clear();
		});

		it('should cache rate to internal object', function () {
			converter.cacheRate(rateName, rate[rateName].value, rate[rateName].date);
			expect(converter.getRateFromCache(rateName)).toEqual(rate[rateName]);
		});

		it('should cache rate to local storage', function () {
			converter = window.CurrencyConverter({
				CACHE_TO_LOCAL_STORAGE: true,
				LOCAL_STORAGE_VARIABLE_NAME: variableName
			});
			converter.cacheRate(rateName, rate[rateName].value, rate[rateName].date);
			
			expect(JSON.parse(localStorage.getItem(variableName))).toEqual({
				RANDOM_RATE: { 
					value: rate[rateName].value, 
					date: rate[rateName].date.toISOString()
				}
			});
		});

	});

	describe('getRateFromCache', function () {

		it('should retrieve USD_EUR rate from cache', function () {
			var rateName = 'USD_EUR';
			var rateValue = 0.5;
			var rateDate = new Date('11/11/2011');
			converter.cacheRate(rateName, rateValue, rateDate);

			expect(converter.getRateFromCache(rateName)).toEqual({
				value: rateValue,
				date: rateDate
			});
		});

		it('should retrieve GBP_HRK rate from cache', function () {
			var rateName = 'GBP_HRK';
			var rateValue = 9.2;
			var rateDate = new Date('11/11/2011');
			converter.cacheRate(rateName, rateValue, rateDate);

			expect(converter.getRateFromCache(rateName)).toEqual({
				value: rateValue,
				date: rateDate
			});
		});

	});

	describe('utilities', function () {
		
		describe('toQuery', function () {
			
			it('should return EUR_USD', function () {
				expect(converter.toQuery('EUR', 'USD')).toEqual('EUR_USD');
			});

			it('should return GBP_EUR', function () {
				expect(converter.toQuery('GBP', 'EUR')).toEqual('GBP_EUR');
			});

			it('should return _', function () {
				expect(converter.toQuery()).toEqual('_');
			});

		});

		describe('isObject', function () {

			it('should return false for undefined', function () {
				expect(converter.isObject(undefined)).toEqual(false);
			});

			it('should return false for null', function () {
				expect(converter.isObject(null)).toEqual(false);
			});

			it('should return false for Number', function () {
				expect(converter.isObject(5)).toEqual(false);
			});

			it('should return false for String', function () {
				expect(converter.isObject('mickey')).toEqual(false);
			});

			it('should return false for function', function () {
				expect(converter.isObject(function () {})).toEqual(false);
			});

			it('should return false for NaN', function () {
				expect(converter.isObject(NaN)).toEqual(false);
			});

			it('should return true for Array', function () {
				expect(converter.isObject([])).toEqual(true);
			});

			it('should return true for Object', function () {
				expect(converter.isObject({})).toEqual(true);
			});

		});

		describe('setToLocalStorage', function () {
			
			var name = 'test';
			var value = 1;

			beforeEach(function () {
				localStorage.clear();
			});

			it('should set variable to local storage', function () {
				converter.setToLocalStorage(name, value);
				expect(JSON.parse(localStorage.getItem(name))).toEqual(value);
			});

			it('should console.error localStorage does not exist', function () {
				spyOn(console, 'error');
				spyOn(localStorage, 'setItem').and.throwError();

				converter.setToLocalStorage(name, value);
				expect(console.error).toHaveBeenCalled();
			});

		});

		describe('getFromLocalStorage', function () {
			
			var name = 'test';
			var value = 1;

			beforeEach(function () {
				localStorage.clear();
			})

			it('should get variable from local storage', function () {
				localStorage.setItem(name, value);
				expect(converter.getFromLocalStorage(name, value)).toEqual(value);
			});

			it('should console.error localStorage does not exist', function () {
				localStorage.setItem(name, value);
				spyOn(console, 'error');
				spyOn(localStorage, 'setItem').and.throwError();

				converter.getFromLocalStorage(name, value);
				expect(console.error).toHaveBeenCalled();
			});

		});

		describe('isLocalStorageAvailable', function () {

			var name = 'test';
			var value = 1;

			it('should return true', function () {
				expect(converter.isLocalStorageAvailable()).toEqual(true);
			});

			it('should return false', function () {
				spyOn(localStorage, 'setItem').and.throwError();
				expect(converter.isLocalStorageAvailable()).toEqual(false);
			});

			it('should return false', function () {
				spyOn(localStorage, 'removeItem').and.throwError();
				expect(converter.isLocalStorageAvailable()).toEqual(false);
			});

		});

		describe('buildUrl', function () {
			
			it('should return url with default queryParams', function () {
				expect(converter.buildUrl()).toEqual('http://free.currencyconverterapi.com/api/v3/convert?compact=y&apiKey=&');
			});

			it('should return url with default queryParams', function () {
				var queryParams = {
					a: 1,
					b: 2
				};
				expect(converter.buildUrl(queryParams)).toEqual('http://free.currencyconverterapi.com/api/v3/convert?compact=y&apiKey=&a=1&b=2&');
			});

		});

	});

});