const salesHeroRequest = {
  method: 'POST',
  uri: 'https://salesheroserver.azurewebsites.net/SalesHero/webservice/deviceservice/wsstockitemtce.php',
  headers: {
    'Content-Type': 'application/json',
    'token': 'e7f2b3f557f020642ebe2ab05650fa6a',
  },
  json: true,
};

const hobiSportsAuthRequest = {
  method: 'POST',
  uri: 'https://hobisports.com/rest/V1/integration/admin/token',
  body: {
    username: 'hobisports',
    password: '%HxZn4u2dZ!F4^gmfE0Q'
  },
  json: true,
}

const getStockStatusRequestTemplate = (authToken, sku) => {
  return {
    method: 'GET',
    uri: `https://hobisports.com/rest/V1/stockItems/${sku}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'hobisports.com',
      'Content-Type': 'application/json',
    },
    json: true
  }
}

const getUpdateStockRequestTemplate = (authToken, sku, itemId, qty) => {
  const payload = {
    'stockItem': {
      'qty': qty
    }
  };

  return {
    method: 'PUT',
    uri: `https://hobisports.com/rest/V1/products/${sku}/stockItems/${itemId}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'hobisports.com',
      'Content-Type': 'application/json',
    },
    body: payload,
    json: true,
  }
}

module.exports = {
  salesHeroRequest,
  hobiSportsAuthRequest,
  getStockStatusRequestTemplate,
  getUpdateStockRequestTemplate,
};
