const _ = require('lodash');
const fs = require('fs');
const request = require('request-promise');
const Promise = require('bluebird');


let getOrderMinSize = currency => {
  if (currency === 'BTC') return 0.001;
  else if (currency === 'ETH') return 0.01;
  else if (currency === 'USDT') return 10;
  else return 1;
};

const options = {
  url: 'https://www.binance.com/exchange-api/v1/public/asset-service/product/get-products',
  headers: {
    Connection: 'keep-alive',
    'User-Agent': 'Request-Promise',
  },
  json: true,
};

request(options)
  .then(body => {
    if (!body && !body.data) {
      throw new Error('Unable to fetch product list, response was empty');
    }

    let assets = _.uniqBy(_.map(body.data, market => market.b));
    let currencies = _.uniqBy(_.map(body.data, market => market.q));
    let pairs = _.map(body.data, market => {
      return {
        pair: [market.q, market.b],
        minimalOrder: {
          amount: parseFloat(market.i),
          price: parseFloat(market.ts),
          order: getOrderMinSize(market.q),
        },
      };
    });

    return { assets: assets, currencies: currencies, markets: pairs };
  })
  .then(markets => {
    fs.writeFileSync('../../wrappers/binance-markets.json', JSON.stringify(markets, null, 2));
    console.log(`Done writing Binance market data`);
  })
  .catch(err => {
    console.log(`Couldn't import products from Binance`);
    console.log(err);
  });
