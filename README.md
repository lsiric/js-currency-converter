## js-currency-converter

js-currency-converter is a currency conversion javascript module, based on [Currency Converter API](http://free.currencyconverterapi.com)

## Usage

`npm instal js-currency-converter`

Include `js-currency-converter.js`, or the minified version `js-currency-converter.min.js` in your webpage. 

jQuery is the only dependency, hence it has to be included **before** `js-currency-converter`.

## Documentation

**Version**: 1.0.0  

* [CurrencyConverter](#module_CurrencyConverter)
    * [.convertAmount(amount, fromCurrency, toCurrency)](#module_CurrencyConverter.convertAmount) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
    * [.fetchQuote(fromCurrency, toCurrency)](#module_CurrencyConverter.fetchQuote) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.getRate(fromCurrency, toCurrency)](#module_CurrencyConverter.getRate) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.config(fromCurrency)](#module_CurrencyConverter.config)

<a name="module_CurrencyConverter.convertAmount"></a>

### CurrencyConverter.convertAmount(amount, fromCurrency, toCurrency) ⇒ <code>Promise.&lt;conversionObject&gt;</code>
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

<a name="module_CurrencyConverter.fetchQuote"></a>

### CurrencyConverter.fetchQuote(fromCurrency, toCurrency) ⇒ <code>Promise.&lt;number&gt;</code>
Returns conversion rate from the API

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves to conversion rate number  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>string</code> | Currency converting from |
| toCurrency | <code>string</code> | Currency converting to |

<a name="module_CurrencyConverter.getRate"></a>

### CurrencyConverter.getRate(fromCurrency, toCurrency) ⇒ <code>Promise.&lt;number&gt;</code>
If the rate is available in the cache and expired, and API rate fetch fails, expired rate is returned if available.

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  
**Returns**: <code>Promise.&lt;number&gt;</code> - Resolves to conversion rate number  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>string</code> | Currency converting from |
| toCurrency | <code>string</code> | Currency converting to |

<a name="module_CurrencyConverter.config"></a>

### CurrencyConverter.config(fromCurrency)
Overrides default CurrencyConverter settings

**Kind**: inner method of <code>[CurrencyConverter](#module_CurrencyConverter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| fromCurrency | <code>options</code> | Currency converting from |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| options.CACHE_TO_LOCAL_STORAGE | <code>number</code> | Cache conversion rate to local storage, if available |
| options.RATES_VALIDITY_HOURS | <code>number</code> | Cached conversion rate validity in hours |
| options.LOCAL_STORAGE_VARIABLE_NAME | <code>number</code> | Local storage variable name for cached conversion rates object |
| options.API_URL | <code>number</code> | API Endpoint url |