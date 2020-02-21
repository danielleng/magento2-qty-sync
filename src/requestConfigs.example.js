const salesHeroRequest = {
  method: 'POST',
  uri: 'https://YOUR-WEB-API-URL-HERE/rest/v1/some-endpoint',
  headers: {
    'Content-Type': 'application/json',
    'token': 'API-TOKEN-HERE',
  },
  json: true,
};

const hobiSportsAuthRequest = {
  method: 'POST',
  uri: 'https://MAGENTO-URL-HERE/rest/V1/integration/admin/token',
  body: {
    username: 'MAGENTO-USERNAME-HERE',
    password: 'MAGENTO-PASSWORD-HERE'
  },
  json: true,
}

const getStockStatusRequestTemplate = (authToken, sku) => {
  return {
    method: 'GET',
    uri: `https://MAGENTO-URL-HERE/rest/V1/stockItems/${sku}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'MAGENTO-HOST-NAME-HERE',
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
    uri: `https://MAGENTO-URL-HERE/rest/V1/products/${sku}/stockItems/${itemId}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'MAGENTO-HOST-NAME-HERE',
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
