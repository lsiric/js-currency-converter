[![Build Status](https://travis-ci.org/lsiric/js-currency-converter.svg?branch=master)](https://travis-ci.org/lsiric/js-currency-converter)

## js-currency-converter

js-currency-converter is a currency conversion javascript module, based on [Currency Converter API](http://free.currencyconverterapi.com)

## Usage

1. `npm instal js-currency-converter`

2. Include `js-currency-converter.js`, or the minified version `js-currency-converter.min.js` in your webpage. 

jQuery is the only dependency, hence it is required in order for `js-currency-converter` to work properly.

### Instantiation

Create a new intance of CurrencyConverter:

`var converter = CurrencyConverter();`

If you have the paid version of the API you just have to change the `API.url` and add your `apiKey` to the `API.queryParams`: 

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

### Fetch Quote

To get a fresh exchange rate **from a server** you can use `fetchQuote` function:

```
converter.fetchQuote('USD_EUR')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9
    //    }
    //}
})
```

To query multiple rates at once, with one API call, just pass in additional queries as parameters.

```
converter.fetchQuote('USD_EUR', 'GBP_KRW')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9
    //    },
    //    'GBP_KRW': {
    //        val: 1405.91
    //    }
    //}
})
```

If multiple `fetchQuote` function calls occur, while another `fetchQuote` with the same conversion rate query is in progress, multiple server calls will **not** be triggered. Instead, every time the same promise will be returned. Server calls are cached while in progress to converse bandwith and ease the usage.

### Get Rate

To get an exchange rate for a currency you can use `getRate` function. If there is a cached rate available, it will be resolved, without fetching a fresh one from the server.

```
converter.getRate('USD_EUR')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9,
    //        expired: false
    //    }
    //}
})
```

To query multiple rates at once, just pass in additional queries as parameters. If there is a cached rate available, it will be resolved, without fetching a fresh one from the server.

```
converter.getRate('USD_EUR', 'GBP_KRW')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9,
    //        expired: false
    //    },
    //    'GBP_KRW': {
    //        val: 1405.91,
    //        expired: false
    //    }
    //}
})
```

If the rate is being cached from the server, and the server call fails, plugin will try to resolve an expired rate from cache. If this operation is successfull, the response will be marked with the `expired` flag set to `true`.

```
converter.getRate('USD_EUR')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9,
    //        expired: true
    //    }
    //}
})
```

### Convert Amount

To convert an amount of money, you can use convertAmount function:

```
converter.convertAmount(100, 'USD_EUR')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9,
    //        expired: false,
    //        amount: 90
    //    }
    //}
});
```

To convert an amount of money, pass in additional conversion strings as parameters: 

```
converter.convertAmount(100, 'USD_EUR', 'GBP_EUR')
.done(function (response) {
    // response = {
    //    'USD_EUR': {
    //        val: 0.9,
    //        expired: false,
    //        amount: 90
    //    },
    //    'GBP_EUR': {
    //        val: 2,
    //        expired: false
    //        amount: 200
    //    }
    // }
})
```

## Caching

By default, CurrencyConverter caches all conversion rates to `localStorage`. This setting can be turned off upon instantiation: 

```
var converter = CurrencyConverter({
    CACHE_TO_LOCAL_STORAGE : false
});
```

Few important rules about caching rates: 

- **every** conversion request is cached **internally** in the CurrencyConverter
- if the `CACHE_TO_LOCAL_STORAGE` is set to `true`, internally cached rates will be cached to `localStorage` too (if available)
- `fetchQuote` will **always** fetch rate directly from the server, bypassing any caching
- `getRate` will **always** check for the internal cached rates, and if there is no valid rate (non-expired), only then the server will be queried for the new rate
- when checking weather the rate is expired or not, `RATES_VALIDITY_HOURS` setting is used 

## Demo

To see it in action, clone the repo, run `npm install`, followed by `gulp demo`.

## Contribution

1. Fork the repo
2. Add awesome stuff
3. Run `gulp docs` to generate fresh documentation
4. Submit PR 

## Documentation

Full documentation can be found in `/docs` folder. 