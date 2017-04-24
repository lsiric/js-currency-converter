describe('CurrencyConverter', function() {
	'use strict';

	var toQueryCode = function (fromCurrency, toCurrency) {
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
		query = toQueryCode(fromRate, toRate),
		errorResponse = 'ERROR',
		simpleResponse = {
			'USD_EUR': {
				'val': 0.94957744
			}
		},
		simpleMultipleResponse = {
			'USD_EUR': {
				'val': 0.94957744
			},
			'EUR_USD': {
				'val': 1.0542
			}
		},
		fullMultipleResponse = {
			'query': {
				'count': 2
			},
			'results': {
				'USD_EUR': {
					'fr': 'USD',
					'id': 'USD_EUR',
					'to': 'EUR',
					'val': 0.94957744
				},
				'EUR_USD': {
					'val': 1.0531,
					'id': 'EUR_USD',
					'to': 'USD',
					'fr': 'EUR'
				}
			}
		},
		fullResponse = {
			'query': {
				'count': 2
			},
			'results': {
				'USD_EUR': {
					'fr': 'USD',
					'id': 'USD_EUR',
					'to': 'EUR',
					'val': 0.94957744
				}
			}
		},
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

		it('should successfuly convert 100USD to 94.9EUR', function (done) {
			var query = 'USD_EUR';
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().resolve(simpleResponse));

			converter.convertAmount(100, query).done(function (result) {
				expect(result[query].amount).toEqual(94.957744);
				done();
			});
		});

		it('should convert amount with expired rate upon API error', function (done) {
			var query = 'USD_EUR';
			converter.cacheRate(query, simpleResponse[query].val, new Date('11/11/2000'));
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().reject('error'));

			converter.convertAmount(100, query).done(function (result) {
				expect(result[query].expired).toEqual(true);
				expect(result[query].amount).toEqual(94.957744);
				done();
			});
		});

		it('should reject promise on conversion error', function (done) {
			var error = 'CONVERSION ERROR';
			spyOn(converter, 'getRate').and.returnValue(jQuery.Deferred().reject(error));

			converter.convertAmount(100, 'EUR_USD').fail(function (er) {
				expect(er).toEqual(error);
				done();
			});
		});

	});

	describe('fetchQuote', function () {

		it('should cache API calls in progress', function () {
			var conversions = ['USD_EUR', 'EUR_USD'];
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(fullResponse));
			var callInProgress = converter.fetchQuote.apply(null, conversions);	
			expect(converter.getConversionInProgress(conversions)).toBe(callInProgress);
		});

		it('should return API calls in progress', function () {
			var conversions = ['USD_EUR', 'EUR_USD'];
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(fullResponse));
			var callInProgress = converter.fetchQuote.apply(null, conversions);

			expect(converter.fetchQuote.apply(null, conversions)).toBe(callInProgress);
		});

		it('should return simple conversion objects for USD_EUR and EUR_USD', function (done) {
			var conversions = ['USD_EUR', 'EUR_USD'];
			converter = window.CurrencyConverter({ API: { queryParams: { compact: 'y' } } });
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(simpleMultipleResponse));

			converter.fetchQuote.apply(null, conversions).done(function (result) {
				expect(result).toEqual(simpleMultipleResponse);
				done();
			});
		});

		it('should return simple conversion object for USD_EUR', function (done) {
			var conversions = ['USD_EUR'];
			converter = window.CurrencyConverter({ API: { queryParams: { compact: 'y' } } });
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(simpleResponse));

			converter.fetchQuote.apply(null, conversions).done(function (result) {
				expect(result).toEqual(simpleResponse);
				done();
			});
		});

		it('should return full conversion objects for USD_EUR and EUR_USD', function (done) {
			var conversions = ['USD_EUR', 'EUR_USD'];
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(fullMultipleResponse));

			converter.fetchQuote.apply(null, conversions).done(function (result) {
				expect(result).toEqual(fullMultipleResponse);
				done();
			});
		});

		it('should return full conversion object for USD_EUR', function (done) {
			var conversions = ['USD_EUR'];
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(fullResponse));

			converter.fetchQuote.apply(null, conversions).done(function (result) {
				expect(result).toEqual(fullResponse);
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

		it('should resolve a simple rate from a server', function (done) {
			var conversions = ['USD_EUR'];
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(simpleResponse));

			converter.getRate.apply(null, conversions).done(function (result) {
				expect(result).toEqual(simpleResponse);
				done();
			});
		});

		it('should resolve a cached rate', function (done) {

			var query = 'USD_EUR';
			var result = {};
			result[query] = {
				val: simpleResponse[query].val,
				expired: false
			};
			// cache rate
			converter.cacheRate(query, simpleResponse[query].val, new Date());
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(simpleResponse));
			
			converter.getRate(query).done(function (result) {
				expect(jQuery.get).not.toHaveBeenCalled();
				expect(result).toEqual(result);
				done();
			});
		});

		it('should resolve an expired cached rate on api error', function (done) {

			var query = 'USD_EUR';
			var result = {};
			result[query] = {
				val: simpleResponse[query].val,
				expired: true
			};
			// cache old rate
			converter.cacheRate(query, simpleResponse[query].val, new Date('11/11/2000'));
			spyOn(jQuery, 'get').and.returnValue(jQuery.Deferred().resolve(simpleResponse));

			converter.getRate(query).done(function (result) {
				expect(jQuery.get).toHaveBeenCalled();
				expect(result).toEqual(result);
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
			val : 0.5,
			date : new Date('11/11/2011')
		};
		
		beforeEach(function () {
			converter = window.CurrencyConverter(defaultOptions);
			localStorage.clear();
		});

		it('should cache CurrencyConverter rate cache object to local storage', function () {
			// save to cache object
			converter.cacheRate(rateName, rate[rateName].val, rate[rateName].date);
			// save to local storage
			converter.cacheToLocalStorage();

			expect(JSON.parse(localStorage.getItem(defaultOptions.LOCAL_STORAGE_VARIABLE_NAME))).toEqual({
				RANDOM_RATE: { 
					val: rate[rateName].val, 
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
			val : 0.5,
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
			converter.cacheRate(rateName, rate[rateName].val, rate[rateName].date);

			// new instance of the converter which will cache rates to local storage
			converter = window.CurrencyConverter({
				CACHE_TO_LOCAL_STORAGE: true
			});

			expect(converter.getRateFromCache(rateName)).toEqual({
				val: rate[rateName].val, 
				expired: true
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
			val : 0.5,
			expired : false
		};

		beforeEach(function () {
			localStorage.clear();
		});

		it('should cache rate to internal object', function () {
			converter.cacheRate(rateName, rate[rateName].val, new Date());
			expect(converter.getRateFromCache(rateName)).toEqual(rate[rateName]);
		});

		it('should cache rate to local storage', function () {
			converter = window.CurrencyConverter({
				CACHE_TO_LOCAL_STORAGE: true,
				LOCAL_STORAGE_VARIABLE_NAME: variableName
			});
			var date = new Date();
			converter.cacheRate(rateName, rate[rateName].val, date);
			
			expect(JSON.parse(localStorage.getItem(variableName))).toEqual({
				RANDOM_RATE: { 
					val: rate[rateName].val, 
					date: date.toISOString()
				}
			});
		});

	});

	describe('getRateFromCache', function () {

		beforeEach(function () {
			localStorage.clear();
		});

		it('should retrieve expired USD_EUR rate from cache', function () {
			var rateName = 'USD_EUR';
			var rateValue = 0.5;
			var rateDate = new Date();
			converter.cacheRate(rateName, rateValue, rateDate);

			expect(converter.getRateFromCache(rateName)).toEqual({
				val: rateValue,
				expired: false
			});
		});

		it('should retrieve GBP_HRK rate from cache', function () {
			var rateName = 'GBP_HRK';
			var rateValue = 9.2;
			var rateDate = new Date('11/11/2011');
			converter.cacheRate(rateName, rateValue, rateDate);

			expect(converter.getRateFromCache(rateName)).toEqual({
				val: rateValue,
				expired: true
			});
		});

	});

	describe('utilities', function () {

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
				expect(converter.buildUrl()).toEqual('http://free.currencyconverterapi.com/api/v3/convert?compact=y&apiKey=');
			});

			it('should return url with default queryParams', function () {
				var queryParams = {
					a: 1,
					b: 2
				};
				expect(converter.buildUrl(queryParams)).toEqual('http://free.currencyconverterapi.com/api/v3/convert?compact=y&apiKey=&a=1&b=2');
			});

		});

	});

});