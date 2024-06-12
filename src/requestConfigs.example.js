export const salesHeroRequest = {
  method: 'GET',
  uri: 'https://www.my-website.com/api/1234?code=1234ABCD',
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive'
  },
  body: {
    'HTTP_TOKEN':'1234ABCD'
  },
  json: true,
};

export const hobiSportsAuthRequest = {
  method: 'POST',
  uri: 'https://my-website.com/rest/V1/integration/admin/token',
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  },
  body: {
    username: '1234ABCD',
    password: '1234ABCD'
  },
  json: true,
}

export const getStockStatusRequestTemplate = (authToken, sku) => {
  return {
    method: 'GET',
    uri: `https://my-website.com/rest/V1/stockItems/${sku}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'my-website.com',
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
    json: true
  }
}

export const getUpdateStockStatusRequestTemplate = (authToken, sku, itemId, is_in_stock) => {
  const payload = {
    'stockItem': {
      'is_in_stock': is_in_stock,
    }
  };

  return {
    method: 'PUT',
    uri: `https://my-website.com/rest/V1/products/${sku}/stockItems/${itemId}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'my-website.com',
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    },
    body: payload,
    json: true,
  }
}

export const getUpdateStockRequestTemplate = (authToken, sku, itemId, qty, is_in_stock) => {
  const payload = {
    'stockItem': {
      'qty': qty,
    }
  };
  if (is_in_stock === true) {
    payload.stockItem['is_in_stock'] = is_in_stock;
  }

  return {
    method: 'PUT',
    uri: `https://my-website.com/rest/V1/products/${sku}/stockItems/${itemId}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Host': 'my-website.com',
      'Content-Type': 'application/json',
    },
    body: payload,
    json: true,
  }
}
