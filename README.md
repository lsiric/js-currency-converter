[![Build Status](https://travis-ci.org/lsiric/js-currency-converter.svg?branch=master)](https://travis-ci.org/lsiric/js-currency-converter)

## js-currency-converter

js-currency-converter is a currency conversion javascript module, based on [Currency Converter API](http://free.currencyconverterapi.com)

## Usage

1. `npm instal js-currency-converter`

2. Include `js-currency-converter.js`, or the minified version `js-currency-converter.min.js` in your webpage. 

jQuery is the only dependency, hence it has to be included **before** `js-currency-converter`.

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

Full documentation can be found in `/docs` folder. 