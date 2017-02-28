[![Build Status](https://travis-ci.org/lsiric/js-currency-converter.svg?branch=master)](https://travis-ci.org/lsiric/js-currency-converter)

## js-currency-converter

js-currency-converter is a currency conversion javascript module, based on [Currency Converter API](http://free.currencyconverterapi.com)

## Usage

`npm instal js-currency-converter`

Include `js-currency-converter.js`, or the minified version `js-currency-converter.min.js` in your webpage. 

jQuery is the only dependency, hence it has to be included **before** `js-currency-converter`.

### Instantiation

To create a new intance of CurrencyConverter:

`var converter = CurrencyConverter();`

Default CurrencyConverter url pointing to the free version of the API (http://free.currencyconverterapi.com/api/v3/convert). 

If you have the paid version of the API you just change the Url and add your `apiKey` to the queryParams: 

```
var converter = CurrencyConverter({
    API : { 
        url: 'http://www.currencyconverterapi.com/api/v3/convert',
        queryParams: {
            apiKey: '987654321'
        }
    }
});
```

### Convert Amount

To convert an amount of money, you can use convertAmount function:

```
converter.convertAmount(100, 'USD', 'EUR')
.done(function (response) {
    console.log(response.value);
});
```

### Get Rate

To get an exchange rate for a currency you can use `getRate` function. If there is a cached rate available, it will be resolved, without fetching a fresh one from the server.

```
converter.getRate('USD', 'EUR')
.done(function (response) {
    console.log(response.rate);
})
```

### Fetch Quote

To get a fresh exchange rate **from a server** you can use `fetchQuote` function:

```
converter.fetchQuote('USD', 'EUR')
.done(function (exchangeRate) {
    console.log(exchangeRate);
})
```

## Demo

To see it in action, clone the repo, run `npm install`, followed by `gulp demo`.

## Contribution

1. Fork the repo
2. Add awesome stuff
3. Run `gulp docs` to generate fresh documentation
4. Submit PR 

## Documentation

**Version**: 1.3.3  

* [CurrencyConverter](#module_CurrencyConverter)
    * [~config(settings)](#module_CurrencyConverter..config)
    * [~getConfig()](#module_CurrencyConverter..getConfig) ⇒ <code>settings</code>
    * [~fetchQuote(fromCurrency, toCurrency)](#module_CurrencyConverter..fetchQuote) ⇒ <code>Promise.&lt;number&gt;</code>
    * [~getRate(fromCurrency, toCurrency)](#module_CurrencyConverter..getRate) ⇒ <code>Promise.&lt;number&gt;</code>
    * [~convertAmount(amount, fromCurrency, toCurrency)](#module_CurrencyConverter..convertAmount) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
    * [~setConversionInProgress(query, promise)](#module_CurrencyConverter..setConversionInProgress)
    * [~isConversionInProgress(query)](#module_CurrencyConverter..isConversionInProgress) ⇒ <code>Boolean</code>
    * [~getConversionInProgress(query)](#module_CurrencyConverter..getConversionInProgress) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
    * [~isRateCached(query)](#module_CurrencyConverter..isRateCached) ⇒ <code>Boolean</code>
    * [~isDateExpired(date)](#module_CurrencyConverter..isDateExpired) ⇒ <code>Boolean</code>
    * [~isRateCachedAndNonExpired(query)](#module_CurrencyConverter..isRateCachedAndNonExpired) ⇒ <code>Boolean</code>
    * [~cacheRate(rateName, value, date)](#module_CurrencyConverter..cacheRate) ⇒ <code>undefined</code>
    * [~getRateFromCache(query)](#module_CurrencyConverter..getRateFromCache) ⇒ <code>conversionObject</code>
    * [~cacheToLocalStorage()](#module_CurrencyConverter..cacheToLocalStorage) ⇒ <code>undefined</code>
    * [~cacheFromLocalStorage()](#module_CurrencyConverter..cacheFromLocalStorage) ⇒ <code>undefined</code>
    * [~toQuery(fromCurrency, toCurrency)](#module_CurrencyConverter..toQuery) ⇒ <code>string</code>
    * [~isObject(value)](#module_CurrencyConverter..isObject) ⇒ <code>Boolean</code>
    * [~setToLocalStorage(key, value)](#module_CurrencyConverter..setToLocalStorage) ⇒ <code>undefined</code>
    * [~getFromLocalStorage(key)](#module_CurrencyConverter..getFromLocalStorage) ⇒ <code>object</code>
    * [~isLocalStorageAvailable()](#module_CurrencyConverter..isLocalStorageAvailable) ⇒ <code>Boolean</code>
    * [~buildUrl(queryParams)](#module_CurrencyConverter..buildUrl) ⇒ <code>string</code>

<a name="module_CurrencyConverter..config"></a>

### CurrencyConverter~config(settings)
Overrides default CurrencyConverter settings

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| settings | <code>object</code> | Overrides CurrencyConverter settings object |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| settings.CACHE_TO_LOCAL_STORAGE | <code>number</code> | Cache conversion rate to local storage, if available |
| settings.RATES_VALIDITY_HOURS | <code>number</code> | Cached conversion rate validity in hours |
| settings.LOCAL_STORAGE_VARIABLE_NAME | <code>string</code> | Variable name where the rates will be cached in local storage |
| settings.API | <code>object</code> | object API configuration object |
| settings.API.url | <code>string</code> | API Endpoint url |
| settings.API.queryParams | <code>object</code> | Query parameters key pair values |
| settings.API.queryParams.apiKey | <code>string</code> | API key for non-free version of the API |
| settings.API.queryParams.compact | <code>string</code> | API response object type |

<a name="module_CurrencyConverter..getConfig"></a>

### CurrencyConverter~getConfig() ⇒ <code>settings</code>
Returns CurrencyConverter settings object

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| settings.CACHE_TO_LOCAL_STORAGE | <code>number</code> | Cache conversion rate to local storage, if available |
| settings.RATES_VALIDITY_HOURS | <code>number</code> | Cached conversion rate validity in hours |
| settings.LOCAL_STORAGE_VARIABLE_NAME | <code>string</code> | Variable name where the rates will be cached in local storage |
| settings.API | <code>object</code> | object API configuration object |
| settings.API.url | <code>string</code> | API Endpoint url |
| settings.API.queryParams | <code>object</code> | Query parameters key pair values |
| settings.API.queryParams.apiKey | <code>string</code> | API key for non-free version of the API |
| settings.API.queryParams.compact | <code>string</code> | API response object type |

<a name="module_CurrencyConverter..fetchQuote"></a>

### CurrencyConverter~fetchQuote(fromCurrency, toCurrency) ⇒ <code>Promise.&lt;number&gt;</code>
Returns conversion rate from the API

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves to conversion rate number  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>string</code> | Currency converting from |
| toCurrency | <code>string</code> | Currency converting to |

<a name="module_CurrencyConverter..getRate"></a>

### CurrencyConverter~getRate(fromCurrency, toCurrency) ⇒ <code>Promise.&lt;number&gt;</code>
Returns conversion rate. 
If the conversion rate is already available in the cache, and not expired, that rate is used. 
If the conversion rate is not available in the cache, API rate fetch is attempted.
If the rate is available in the cache but expired, API rate fetch is attempted.
If the rate is available in the cache and expired, and API rate fetch fails, expired rate is returned if available.

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves to conversion rate number  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>string</code> | Currency converting from |
| toCurrency | <code>string</code> | Currency converting to |

<a name="module_CurrencyConverter..convertAmount"></a>

### CurrencyConverter~convertAmount(amount, fromCurrency, toCurrency) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
Converts given amount from given currency to given currency

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;conversionObject&gt;</code> - Promise to the conversionObject  

| Param | Type | Description |
| --- | --- | --- |
| amount | <code>number</code> | Amount of money converting |
| fromCurrency | <code>string</code> | Currency converting from |
| toCurrency | <code>string</code> | Currency converting to |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| conversionObject.value | <code>number</code> | converted amount |
| conversionObject.rate | <code>number</code> | conversion rate |
| conversionObject.expired | <code>boolean</code> | is the rate expired (considering RATES_VALIDITY_HOURS) |

<a name="module_CurrencyConverter..setConversionInProgress"></a>

### CurrencyConverter~setConversionInProgress(query, promise)
Sets given query and promise as a key:value pair in the private CONVERSIONS_IN_PROGRESS object

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | Query RATETO_RATEFROM key - pair |
| promise | <code>Promise.&lt;conversionObject&gt;</code> | Conversion in progress promise |

<a name="module_CurrencyConverter..isConversionInProgress"></a>

### CurrencyConverter~isConversionInProgress(query) ⇒ <code>Boolean</code>
Returns boolean wether the API call for given query is in progress

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | RATETO_RATEFROM string |

<a name="module_CurrencyConverter..getConversionInProgress"></a>

### CurrencyConverter~getConversionInProgress(query) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
Returns a promise in progress for the given query

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;conversionObject&gt;</code> - Promise to the conversionObject  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | RATETO_RATEFROM string |

<a name="module_CurrencyConverter..isRateCached"></a>

### CurrencyConverter~isRateCached(query) ⇒ <code>Boolean</code>
Returns boolean wether the conversion object for the given query is cached in memory

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | RATETO_RATEFROM string |

<a name="module_CurrencyConverter..isDateExpired"></a>

### CurrencyConverter~isDateExpired(date) ⇒ <code>Boolean</code>
Returns boolean wether the input date is lesser then the SETTINGS.RATES_VALIDITY_HOURS setting

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| date | <code>string</code> | Date string |

<a name="module_CurrencyConverter..isRateCachedAndNonExpired"></a>

### CurrencyConverter~isRateCachedAndNonExpired(query) ⇒ <code>Boolean</code>
Returns the combination of CurrencyConverter.isRateCached CurrencyConverter.isDateExpired functions

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | RATETO_RATEFROM string |

<a name="module_CurrencyConverter..cacheRate"></a>

### CurrencyConverter~cacheRate(rateName, value, date) ⇒ <code>undefined</code>
Caches given rate to the memory. If SETTINGS.CACHE_TO_LOCAL_STORAGE is true, entire CACHED_RATES object will be cached to localStorage as well

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| rateName | <code>string</code> | Conversion rate name in RATETO_RATEFROM format. This is the key under which the conversion object will be mapped in the CACHED_RATES private object |
| value | <code>number</code> | Conversion rate value |
| date | <code>date</code> | Converesion rate caching date |

<a name="module_CurrencyConverter..getRateFromCache"></a>

### CurrencyConverter~getRateFromCache(query) ⇒ <code>conversionObject</code>
Returns the conversion rate object form memory for the given query

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | RATETO_RATEFROM string |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| conversionObject.value | <code>number</code> | converted amount |
| conversionObject.rate | <code>number</code> | conversion rate |

<a name="module_CurrencyConverter..cacheToLocalStorage"></a>

### CurrencyConverter~cacheToLocalStorage() ⇒ <code>undefined</code>
Caches the private CACHED_RATES object to local storage

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
<a name="module_CurrencyConverter..cacheFromLocalStorage"></a>

### CurrencyConverter~cacheFromLocalStorage() ⇒ <code>undefined</code>
Sets the private CACHED_RATES object to the value from localStorage

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
<a name="module_CurrencyConverter..toQuery"></a>

### CurrencyConverter~toQuery(fromCurrency, toCurrency) ⇒ <code>string</code>
Returns the concatenated string of the two valued passed in, with underscore (_) as a concat character

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>string</code> | Rate we are converting from |
| toCurrency | <code>string</code> | Rate we are converting to |

<a name="module_CurrencyConverter..isObject"></a>

### CurrencyConverter~isObject(value) ⇒ <code>Boolean</code>
Returns boolean wether the passed in variable is an object or not

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>object</code> | Object we are testing |

<a name="module_CurrencyConverter..setToLocalStorage"></a>

### CurrencyConverter~setToLocalStorage(key, value) ⇒ <code>undefined</code>
Sets given key:value pair to the local storage

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>key</code> | Key for the given value |
| value | <code>value</code> | Value for the given key |

<a name="module_CurrencyConverter..getFromLocalStorage"></a>

### CurrencyConverter~getFromLocalStorage(key) ⇒ <code>object</code>
Retrieves a value from the local storage for the given key. On error returns empty object

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>key</code> | Key for the given value |

<a name="module_CurrencyConverter..isLocalStorageAvailable"></a>

### CurrencyConverter~isLocalStorageAvailable() ⇒ <code>Boolean</code>
Tests the existence of the localStorage object on the global object

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
<a name="module_CurrencyConverter..buildUrl"></a>

### CurrencyConverter~buildUrl(queryParams) ⇒ <code>string</code>
Builds API endpoint url from SETTINGS.API.url, SETTINGS.API.queryParams, and query parameters passed in

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| queryParams | <code>object</code> | Query parameter key pair values |