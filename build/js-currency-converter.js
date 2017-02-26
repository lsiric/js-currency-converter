(function (define) {
	'use strict';

	/** 
	 * @module CurrencyConverter
	 * @description JavaScript currency converter
	 * @version 1.0.0
	 */
	define(['jquery'], function ($) {

		return (function (settings) {

			var HOURS = 60 * 60 * 1000,
				DEFAULTS = {
					RATES_VALIDITY_HOURS : 24,
					CACHE_TO_LOCAL_STORAGE : false,
					LOCAL_STORAGE_VARIABLE_NAME: 'JS_CURRENCY_CONVERTER_CACHED_RATES',
					API_URL : 'http://free.currencyconverterapi.com/api/v3/convert?compact=y&q='
				},
				SETTINGS = $.extend({}, DEFAULTS, settings),
				CACHED_RATES = {},
				CONVERSIONS_IN_PROGRESS = {};

			var CurrencyConverter = {};

			// MAIN FUNCTIONS
			CurrencyConverter.config = config;
			CurrencyConverter.getConfig = getConfig;

			CurrencyConverter.getRate = getRate;
			CurrencyConverter.fetchQuote = fetchQuote;
			CurrencyConverter.convertAmount = convertAmount;

			// API CONVERSION IN PROGRESS
			CurrencyConverter.isConversionInProgress = isConversionInProgress;
			CurrencyConverter.setConversionInProgress = setConversionInProgress;
			CurrencyConverter.getConversionInProgress = getConversionInProgress;

			// CACHE HELPERS
			CurrencyConverter.cacheToLocalStorage = cacheToLocalStorage;
			CurrencyConverter.cacheFromLocalStorage = cacheFromLocalStorage;

			CurrencyConverter.isCachedRateValid = isCachedRateValid;
			CurrencyConverter.isRateCached = isRateCached;
			CurrencyConverter.isCachedRateExpired = isCachedRateExpired;

			CurrencyConverter.cacheRate = cacheRate;
			CurrencyConverter.getRateFromCache = getRateFromCache;

			// UTILITIES
			CurrencyConverter.toQuery = toQuery;
			CurrencyConverter.isObject = isObject;
			CurrencyConverter.isString = isString;
			CurrencyConverter.setToLocalStorage = setToLocalStorage;
			CurrencyConverter.getFromLocalStorage = getFromLocalStorage;
			CurrencyConverter.isLocalStorageAvailable = isLocalStorageAvailable;

			if(SETTINGS.CACHE_TO_LOCAL_STORAGE) {
				CurrencyConverter.cacheFromLocalStorage();
			}

			return CurrencyConverter;



			/**
			* @function config
			* @description Overrides default CurrencyConverter settings
			* @param {object} settings Overrides CurrencyConverter settings object 
			* @property {number} settings.CACHE_TO_LOCAL_STORAGE Cache conversion rate to local storage, if available
			* @property {number} settings.RATES_VALIDITY_HOURS Cached conversion rate validity in hours
			* @property {string} settings.LOCAL_STORAGE_VARIABLE_NAME Variable name where the rates will be cached in local storage
			* @property {string} settings.API_URL API Endpoint url
			*/
			function config (options) {
				if (CurrencyConverter.isObject(options)) {
					SETTINGS = $.extend(SETTINGS, options);
				}
			}



			/**
			* @function getConfig
			* @description Returns CurrencyConverter settings object
			* @return {settings} 
			* @property {number} settings.CACHE_TO_LOCAL_STORAGE Cache conversion rate to local storage, if available
			* @property {number} settings.RATES_VALIDITY_HOURS Cached conversion rate validity in hours
			* @property {string} settings.LOCAL_STORAGE_VARIABLE_NAME Variable name where the rates will be cached in local storage
			* @property {string} settings.API_URL API Endpoint url
			*/
			function getConfig () {
				return SETTINGS;
			}



			/**
			* @function fetchQuote
			* @description Returns conversion rate from the API
			* @param {string} fromCurrency Currency converting from
			* @param {string} toCurrency Currency converting to
			* @return {Promise<number>} Resolves to conversion rate number
			*/
			function fetchQuote (fromCurrency, toCurrency) {

				var deferred = $.Deferred();
				var query = CurrencyConverter.toQuery(fromCurrency, toCurrency);

				// If the call for the same converesion is in progress, return the same promise
				if(CurrencyConverter.isConversionInProgress(query)) {
					return CurrencyConverter.getConversionInProgress(query);
				}

				$.get(SETTINGS.API_URL + query)
				.done(onSuccess)
				.fail(onError)
				.always(onAlways);

				// cache the promise, in case it gets called while this one is in progress
				CurrencyConverter.setConversionInProgress(query, deferred.promise());

				return deferred.promise()	;

				function onSuccess (response) {
					// cache the result
					CurrencyConverter.cacheRate(query, response[query].val, new Date());
					deferred.resolve(response[query].val);
				}

				function onError (error) {
					deferred.reject(error);
				}

				function onAlways () {
					// dereference API call which was in progress
					CurrencyConverter.setConversionInProgress(query, null);
				}

			}



			/**
			* @function getRate
			* @description Returns conversion rate. 
			* If the conversion rate is already available in the cache, and not expired, that rate is used. 
			* If the conversion rate is not available in the cache, API rate fetch is attempted.
			* If the rate is available in the cache but expired, API rate fetch is attempted.
			* If the rate is available in the cache and expired, and API rate fetch fails, expired rate is returned if available.
			* @param {string} fromCurrency Currency converting from
			* @param {string} toCurrency Currency converting to
			* @return {Promise<number>} Resolves to conversion rate number
			*/
			function getRate (fromCurrency, toCurrency) {

				var deferred = $.Deferred();
				var query = CurrencyConverter.toQuery(fromCurrency, toCurrency);

				// if there' a non-expired rate in the cache, return it
				if(CurrencyConverter.isCachedRateValid(query)) {
					resolveRate(false, CACHED_RATES[query].value);
				}
				// otherwise fetch it from the api 
				else {
					CurrencyConverter.fetchQuote(fromCurrency, toCurrency)
					.done(fetchOnSuccess)
					.fail(oldRateFallback);
				}

				return deferred.promise();

				function fetchOnSuccess (rate) {
					resolveRate(false, rate);
				}

				// if the api fails, try to return an expired rate as a failback
				function oldRateFallback (error) {

					// if rate is cached but expired, resolve old rate
					if(CurrencyConverter.isRateCached(query)){
						resolveRate(true, CACHED_RATES[query].value);
					} else {
						deferred.reject(error);
					}

				}

				function resolveRate (isExpired, rateValue) {
					deferred.resolve({
						expired: isExpired,
						rate: rateValue
					});
				}

			}



			/**
			* @function convertAmount
			* @description Converts given amount from given currency to given currency
			* @param {number} amount Amount of money converting
			* @param {string} fromCurrency Currency converting from
			* @param {string} toCurrency Currency converting to
			* @return {Promise<conversionObject>} Promise to the conversionObject
			* @property {number} conversionObject.value converted amount
			* @property {number} conversionObject.rate conversion rate
			* @property {boolean} conversionObject.expired is the rate expired (considering RATES_VALIDITY_HOURS)
			*/
			function convertAmount (amount, fromCurrency, toCurrency) {

				var deferred = $.Deferred();

				CurrencyConverter.getRate(fromCurrency, toCurrency)
				.done(onSuccess)
				.fail(onError);

				return deferred.promise()	;

				function onSuccess (data) {
					data.value = amount * data.rate;
					deferred.resolve(data);
				}

				function onError (error) {
					deferred.reject(error);
				}

			}




		// API CONVERSION IN PROGRESS
			function setConversionInProgress (query, promise) {
				CONVERSIONS_IN_PROGRESS[query] = promise;
			}

			function isConversionInProgress (query) {
				return Boolean(CurrencyConverter.getConversionInProgress(query));
			}

			function getConversionInProgress (query) {
				return CONVERSIONS_IN_PROGRESS[query];
			}



			
		// CACHE

			function isRateCached (queryCode) {
				return CurrencyConverter.isObject(CACHED_RATES[queryCode]);
			}

			function isCachedRateExpired (dateString) {
				// when the rate is fetched from local storage, the date is a String
				var cachedRateDateTime = new Date(dateString).getTime();
				var nowDateTime = new Date().getTime();
				return (nowDateTime - cachedRateDateTime) > (SETTINGS.RATES_VALIDITY_HOURS * HOURS);
			}

			function isCachedRateValid (queryCode) {
				return CurrencyConverter.isRateCached(queryCode) 
					&& !CurrencyConverter.isCachedRateExpired(CACHED_RATES[queryCode].date);
			}

			function cacheRate (rateName, value, date) {
				CACHED_RATES[rateName] = {
					value: value,
					date: date
				};
				if(SETTINGS.CACHE_TO_LOCAL_STORAGE) {
					CurrencyConverter.cacheToLocalStorage();
				}
			}

			function getRateFromCache (query) {
				return CACHED_RATES[query];
			}

			function cacheToLocalStorage () {
				CurrencyConverter.setToLocalStorage(SETTINGS.LOCAL_STORAGE_VARIABLE_NAME, CACHED_RATES);
			}

			function cacheFromLocalStorage () {
				CACHED_RATES = getFromLocalStorage(SETTINGS.LOCAL_STORAGE_VARIABLE_NAME) || {};
			}





		// UTILITIES

			function toQuery (fromCurrency, toCurrency) {
				return (fromCurrency || '') + '_' + (toCurrency || '');
			}

			function isObject(value) {
				return value !== null && typeof value === 'object';
			}

			function isString(value) {
				return typeof value === 'string';
			}

			function setToLocalStorage (key, value) {
				if (CurrencyConverter.isLocalStorageAvailable()) {
					localStorage.setItem(key, JSON.stringify(value));
				} else {
					console.error('Caching rates to local storage failed. Local storage not available');
				}
			}

			function getFromLocalStorage (key) {
				if (CurrencyConverter.isLocalStorageAvailable()) {
					try {
						return JSON.parse(localStorage.getItem(key)) || {};
					} catch (e) {
						return {};
					}
				} else {
					console.error('Retrieving rates from local storage failed. Local storage not available');
				}
			}

			function isLocalStorageAvailable(){
				var test = 'js-currency-test';
				try {
					localStorage.setItem(test, test);
					localStorage.removeItem(test);
					return true;
				} catch(e) {
					return false;
				}
			}

		});
	});

}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
	/* istanbul ignore next */
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require('jquery'));
	} else {
		window.CurrencyConverter = factory(window.jQuery);
	}
}));