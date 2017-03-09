(function (define) {
	'use strict';

	/** 
	 * @module CurrencyConverter
	 * @description JavaScript currency converter
	 */
	define(['jquery'], function ($) {

		return (function (settings) {

			var HOURS = 60 * 60 * 1000,
				DEFAULTS = {
					RATES_VALIDITY_HOURS : 24,
					CACHE_TO_LOCAL_STORAGE : true,
					LOCAL_STORAGE_VARIABLE_NAME: 'JS_CURRENCY_CONVERTER_CACHED_RATES',
					API: {
						url: 'http://free.currencyconverterapi.com/api/v3/convert',
						queryParams: {
							compact: 'y',
							apiKey: ''
						}
					}
				},
				SETTINGS = $.extend(true, DEFAULTS, settings),
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

			CurrencyConverter.isRateCachedAndNonExpired = isRateCachedAndNonExpired;
			CurrencyConverter.isRateCached = isRateCached;
			CurrencyConverter.isDateExpired = isDateExpired;

			CurrencyConverter.cacheRate = cacheRate;
			CurrencyConverter.getRateFromCache = getRateFromCache;

			// UTILITIES
			CurrencyConverter.isObject = isObject;
			CurrencyConverter.setToLocalStorage = setToLocalStorage;
			CurrencyConverter.getFromLocalStorage = getFromLocalStorage;
			CurrencyConverter.isLocalStorageAvailable = isLocalStorageAvailable;
			CurrencyConverter.buildUrl = buildUrl;

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
			* @property {object} settings.API object API configuration object
			* @property {string} settings.API.url API Endpoint url
			* @property {object} settings.API.queryParams Query parameters key pair values
			* @property {string} settings.API.queryParams.apiKey API key for non-free version of the API
			* @property {string} settings.API.queryParams.compact API response object type
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
			* @property {object} settings.API object API configuration object
			* @property {string} settings.API.url API Endpoint url
			* @property {object} settings.API.queryParams Query parameters key pair values
			* @property {string} settings.API.queryParams.apiKey API key for non-free version of the API
			* @property {string} settings.API.queryParams.compact API response object type
			*/
			function getConfig () {
				return SETTINGS;
			}



			/**
			* @function fetchQuote
			* @description Returns conversion rate from the API
			* @param {...string} conversions Conversion strings. Multiple conversion strings can be passed in simultaneously, the api will handle all of them in one call. Results will be resolved all at once in the conversionObject. Currency codes inside of the conversion string have to be delimited by '_' (USD_EUR, GBP_KRW, etc.).
			* @return {Promise<conversionObject>} Resolves to conversion rate object
			* @property {number} conversionObject.val conversion rate
			*/
			function fetchQuote () {

				var deferred = $.Deferred(),
					query = [].slice.call(arguments).join(','),
					isCompact = SETTINGS.API.queryParams.compact === 'y',
					results;

				// If the call for the same converesion is in progress, return the same promise
				if(CurrencyConverter.isConversionInProgress(query)) {
					return CurrencyConverter.getConversionInProgress(query);
				}

				$.get(CurrencyConverter.buildUrl({q:query}))
				.done(onSuccess)
				.fail(onError)
				.always(onAlways);

				// cache the promise, in case it gets called while this one is in progress
				CurrencyConverter.setConversionInProgress(query, deferred.promise());

				return deferred.promise();

				function onSuccess (response) {
					// strip the response object 
					results = isCompact ? response : response.results;
					// cache the results
					$.each(results, function (key, val) {
						CurrencyConverter.cacheRate(key, val.val, new Date());	
					});
					deferred.resolve(results);
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
			* @param {...string} conversions Conversion strings. Multiple conversion strings can be passed in simultaneously. Cached and non expired conversion rates will be used, and non-cached ones will be fetched from the server. Results will be merged and resolved through conversionObject.
			* @return {Promise<conversionObject>} Resolves to conversion rate object
			* @property {number} conversionObject.val conversion rate
			* @property {number} conversionObject.expired conversion rate expiriy flag
			*/
			function getRate () {

				var queries = [].slice.call(arguments),
					deferred = $.Deferred(),
					result = {},
					nonCachedQueries = [];

				// instantly resolve rates which are cached and not expired
				$.each(queries, function (i, query) {
					if(CurrencyConverter.isRateCachedAndNonExpired(query)) {
						result[query] = CurrencyConverter.getRateFromCache(query);
					} else {
						nonCachedQueries.push(query);
					}
				});

				if(nonCachedQueries.length === 0) {
					// all conversions are available from the cache
					return deferred.resolve(result);
				} else {
					// some rates have to be fetched from the server
					CurrencyConverter.fetchQuote(nonCachedQueries)
						.done(fetchOnSuccess)
						.fail(oldRateFallback);
				}

				return deferred.promise();

				function fetchOnSuccess (response) {
					// merge already cached rates and freshly fetched rates
					deferred.resolve($.extend(result, response));
				}

				// if the api fails, try to return an expired rate as a failback
				function oldRateFallback (error) {
					$.each(nonCachedQueries, function (i, query) {
						// if rate is cached but expired, resolve old rate
						if(CurrencyConverter.isRateCached(query)){
							result[query] = CurrencyConverter.getRateFromCache(query);
						} else {
							deferred.reject(error);
						}
					});
					deferred.resolve(result);
				}
			}



			/**
			* @function convertAmount
			* @description Converts given amount from given currency to given currency
			* @param {number} amount First parameter is the amount of money converting
			* @param {...string} conversions All following string parameters are conversion strings 
			* @return {Promise<conversionObject>} Promise to the conversionObject
			* @property {number} conversionObject.amount converted amount
			* @property {number} conversionObject.val conversion rate
			* @property {boolean} conversionObject.expired is the rate expired (considering RATES_VALIDITY_HOURS)
			*/
			function convertAmount () {

				var amount = [].slice.call(arguments, 0, 1)[0],
					queries = [].slice.call(arguments, 1).join(','),
					deferred = $.Deferred();

				CurrencyConverter.getRate(queries)
				.done(onSuccess)
				.fail(onError);

				return deferred.promise();

				function onSuccess (response) {
					$.each(response, function (key, value) {
						value.amount = amount * value.val;
					});
					deferred.resolve(response);
				}

				function onError (error) {
					deferred.reject(error);
				}

			}




			/**
			* @function setConversionInProgress
			* @description Sets given query and promise as a key:value pair in the private CONVERSIONS_IN_PROGRESS object
			* @param {string} query Query RATETO_RATEFROM key - pair
			* @param {Promise<conversionObject>} promise Conversion in progress promise
			*/
			function setConversionInProgress (query, promise) {
				CONVERSIONS_IN_PROGRESS[query] = promise;
			}



			/**
			* @function isConversionInProgress
			* @description Returns boolean wether the API call for given query is in progress
			* @return {Boolean} 
			* @param {string} query RATETO_RATEFROM string 
			*/
			function isConversionInProgress (query) {
				return Boolean(CurrencyConverter.getConversionInProgress(query));
			}



			/**
			* @function getConversionInProgress
			* @description Returns a promise in progress for the given query
			* @return {Promise<conversionObject>} Promise to the conversionObject
			* @param {string} query RATETO_RATEFROM string 
			*/
			function getConversionInProgress (query) {
				return CONVERSIONS_IN_PROGRESS[query];
			}


			
			/**
			* @function isRateCached
			* @description Returns boolean wether the conversion object for the given query is cached in memory
			* @return {Boolean} 
			* @param {string} query RATETO_RATEFROM string 
			*/
			function isRateCached (query) {
				return CurrencyConverter.isObject(CACHED_RATES[query]);
			}



			/**
			* @function isDateExpired
			* @description Returns boolean wether the input date is lesser then the SETTINGS.RATES_VALIDITY_HOURS setting
			* @return {Boolean} 
			* @param {string} date Date string 
			*/
			function isDateExpired (dateString) {
				// when the rate is fetched from local storage, the date is a String
				var cachedRateDateTime = new Date(dateString).getTime();
				var nowDateTime = new Date().getTime();
				return (nowDateTime - cachedRateDateTime) > (SETTINGS.RATES_VALIDITY_HOURS * HOURS);
			}



			/**
			* @function isRateCachedAndNonExpired
			* @description Returns the combination of CurrencyConverter.isRateCached CurrencyConverter.isDateExpired functions
			* @return {Boolean} 
			* @param {string} query RATETO_RATEFROM string
			*/
			function isRateCachedAndNonExpired (query) {
				return CurrencyConverter.isRateCached(query) 
					&& !CurrencyConverter.isDateExpired(CACHED_RATES[query].date);
			}



			/**
			* @function cacheRate
			* @description Caches given rate to the memory. If SETTINGS.CACHE_TO_LOCAL_STORAGE is true, entire CACHED_RATES object will be cached to localStorage as well
			* @return {undefined} 
			* @param {string} rateName Conversion rate name in RATETO_RATEFROM format. This is the key under which the conversion object will be mapped in the CACHED_RATES private object
			* @param {number} value Conversion rate value
			* @param {date} date Converesion rate caching date
			*/
			function cacheRate (rateName, value, date) {
				CACHED_RATES[rateName] = {
					val: value,
					date: date
				};
				if(SETTINGS.CACHE_TO_LOCAL_STORAGE) {
					CurrencyConverter.cacheToLocalStorage();
				}
			}



			/**
			* @function getRateFromCache
			* @description Returns the conversion rate object form memory for the given query
			* @return {conversionObject} 
			* @property {number} conversionObject.val converted amount
			* @property {boolean} conversionObject.expired conversion rate
			*/
			function getRateFromCache (query) {
				var rate = $.extend({}, CACHED_RATES[query]);
				return {
					val: rate.val,
					expired: CurrencyConverter.isDateExpired(rate.date)
				};
			}



			/**
			* @function cacheToLocalStorage
			* @description Caches the private CACHED_RATES object to local storage
			* @return {undefined} 
			*/
			function cacheToLocalStorage () {
				CurrencyConverter.setToLocalStorage(SETTINGS.LOCAL_STORAGE_VARIABLE_NAME, CACHED_RATES);
			}



			/**
			* @function cacheFromLocalStorage
			* @description Sets the private CACHED_RATES object to the value from localStorage
			* @return {undefined} 
			*/
			function cacheFromLocalStorage () {
				CACHED_RATES = CurrencyConverter.getFromLocalStorage(SETTINGS.LOCAL_STORAGE_VARIABLE_NAME);
			}



			/**
			* @function isObject
			* @description Returns boolean wether the passed in variable is an object or not
			* @return {Boolean}
			* @param {object} value Object we are testing
			*/
			function isObject(value) {
				return value !== null && typeof value === 'object';
			}



			/**
			* @function setToLocalStorage
			* @description Sets given key:value pair to the local storage
			* @return {undefined}
			* @param {key} key Key for the given value
			* @param {value} value Value for the given key
			*/
			function setToLocalStorage (key, value) {
				if (CurrencyConverter.isLocalStorageAvailable()) {
					localStorage.setItem(key, JSON.stringify(value));
				} else {
					console.error('Caching rates to local storage failed. Local storage not available');
				}
			}



			/**
			* @function getFromLocalStorage
			* @description Retrieves a value from the local storage for the given key. On error returns empty object
			* @return {object}
			* @param {key} key Key for the given value
			*/
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



			/**
			* @function isLocalStorageAvailable
			* @description Tests the existence of the localStorage object on the global object
			* @return {Boolean}
			*/
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


			/**
			* @function buildUrl
			* @description Builds API endpoint url from SETTINGS.API.url, SETTINGS.API.queryParams, and queryParams passed in 
			* @return {string}
			* @param {object} queryParams Query parameter key pair values
			*/					
			function buildUrl (queryParams) {
				var url = SETTINGS.API.url + '?';
				var params = $.extend({}, SETTINGS.API.queryParams, queryParams);
				$.each(params, function (key, value, i) {
					url += key + '=' + value + '&';
				});
				return encodeURI(url.substring(0, url.length-1));
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