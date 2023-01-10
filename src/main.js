const _ = require('lodash');
// https://www.npmjs.com/package/request-promise
const Request = require('request-promise-native');
const Fs = require('fs');
const FsPromise = require('fs').promises;

const Logger = require('./logger');
const salesHeroRequest = require('./requestConfigs').salesHeroRequest;
const hobiSportsAuthRequest = require('./requestConfigs').hobiSportsAuthRequest;
const getStockStatusRequestTemplate = require('./requestConfigs').getStockStatusRequestTemplate;
const getUpdateStockRequestTemplate = require('./requestConfigs').getUpdateStockRequestTemplate;
const getUpdateStockStatusRequestTemplate = require('./requestConfigs').getUpdateStockStatusRequestTemplate;

// Global Trackers
let SKUS = 0;
let SKUS_QTY_UPDATED = 0;
let SKUS_STOCK_STATUS_UPDATED = 0;
let SKUS_NOT_ON_HOBISPORTS = [];
let SKUS_TO_IGNORE_FROM_FILE = [];
let TIME_START;
let TIME_END;

async function getProducts() {
  try {
    const res = await Request(salesHeroRequest);
    const products = res.items;
    return products;

  } catch (err) {
    Logger.logError(err);
    console.log(err);
  }
}

async function getHobiSportsAuthToken() {
  try {
    const authToken = await Request(hobiSportsAuthRequest);
    return authToken;

  } catch (err) {
    Logger.logError(err);
    console.log(err);
  }
}

async function updateStock(authToken, sku, salesHeroQty) {
  try {
    const stockStatusRequest = getStockStatusRequestTemplate(authToken, sku);
    const results = await Request(stockStatusRequest);
    const hobisportsQty = parseInt(results.qty);
    const is_in_stock = results.is_in_stock;

    if (salesHeroQty !== hobisportsQty) {
      let updateStockRequest;
      // If quantity has changed, and hobisports stock is 0 and status is out of stock, we need to set the product status to back in stock.
      if (hobisportsQty === 0 && (is_in_stock === false)) {
        updateStockRequest = getUpdateStockRequestTemplate(authToken, sku, results.item_id, salesHeroQty, true);
      } else {
        updateStockRequest = getUpdateStockRequestTemplate(authToken, sku, results.item_id, salesHeroQty);
      }
      let updatedStockResults = await Request(updateStockRequest);
      Logger.logInfo(`Quantity update successful for SKU: "${sku}" | Old Quantity: ${hobisportsQty} | New Quantity: ${salesHeroQty}`, '200');
      SKUS_QTY_UPDATED++;
      return updatedStockResults;

    } else {
      // If quantity remain unchanged, check stock status and update stock status accordingly.
      if (hobisportsQty > 0 && is_in_stock !== true) {
        let updateStockRequest;
        updateStockRequest = getUpdateStockStatusRequestTemplate(authToken, sku, results.item_id, true);
        let updatedStockResults = await Request(updateStockRequest);
        Logger.logInfo(`Stock Status update successful for SKU: "${sku}" | Old is_in_stock: ${is_in_stock} | New is_in_stock: true`, '200');
        SKUS_STOCK_STATUS_UPDATED++;
        return updatedStockResults;
      }
      Logger.logInfo(`Quantity unchanged for SKU: "${sku}"`, '200');
      return false;
    }

  } catch (err) {
    const parameters = err.error.parameters;
    let errorMessage = err.error.message;
    if (parameters && parameters.length > 0) {
      for (let i = 1; i <= parameters.length; i++) {
        errorMessage = errorMessage.replace(`%${i}`, parameters[i - 1]);
        Logger.logError(`${errorMessage}`, err.statusCode);
      }
    } else {
      Logger.logError(err);
    }
    if (err.statusCode && err.statusCode === 404) {
      SKUS_NOT_ON_HOBISPORTS.push(sku);
    }
    return false;
  }
}

async function readIgnoreSkusFile() {
  try {
    const data = await FsPromise.readFile('ignore_skus.txt', 'utf8');
    const processedData = _.map(data.toString().split("\n"), function(sku) {
      return {
        "item_code": sku
      }
    });
    return processedData;
  } catch (err) {
    Logger.logError(err);
    console.log(err);
  }
}

async function run() {
  try {
    TIME_START = new Date().toISOString();
    const [hobiSportsAuthToken, products] = await Promise.all([getHobiSportsAuthToken(), getProducts()]);
    // Check for command line args
    const args = process.argv.slice(2);

    // Filter only products with item_code and balqty field values
    let legitProducts = _.filter(products, (product) => {
      return (
        product.item_code
        && product.balqty
        && product.item_code.length !== 0
        && product.balqty.length !== 0);
    });

    if (args.length === 0) {
      // Read ignore sku file and diff the list of products to remove SKUs that are ignored
      SKUS_TO_IGNORE_FROM_FILE = await readIgnoreSkusFile();
      legitProducts = _.differenceBy(legitProducts, SKUS_TO_IGNORE_FROM_FILE, 'item_code');
    }

    // Remove duplicates
    let uniqLegitProducts = _.uniqBy(legitProducts, (product) => {
      return product.item_code;
    });
    SKUS = uniqLegitProducts.length;

    Logger.logInfo(`Checking and updating quantity for ${SKUS} products...`, '---');
    console.log(`Checking and updating quantity for ${SKUS} products...`);

    // Cycle through products and check if there is a change in stock
    for (const product of uniqLegitProducts) {
      let serverQty;
      if (product.balqty === '.0000') {
        serverQty = 0;
      } else {
        serverQty = parseInt(product.balqty);
      }

      if (typeof serverQty === 'number') {
        // 23-12-2022
        // Eric: "Hey Daniel, can you subtract all the sql stock quantity data extracted through api by 5? Meaning if hobi website extract a certain's product quantity is 5, hobi website will show 'out of stock'. If the extracted quantity is 6, website will show '1 left'"
        const subtractedServerQty = (serverQty - 5) > 0 ? (serverQty - 5) : 0;
        const updated = await updateStock(hobiSportsAuthToken, product.item_code, subtractedServerQty);
      } else {
        Logger.logWarning(`Server returned a quantity that cannot be parsed into a number: ${product.balqty}, for SKU: "${product.item_code}"`, '---');
        Logger.logWarning(`Type of serverQty: ${typeof serverQty}`);
      }
    };

    if (args.length > 0) {
      switch(args[0]) {
        case 'updateignoreskus':
          Logger.logInfo('Found command line arg \'updateignoreskus\', updating ignore_skus.txt...', '---');
          console.log('Found command line arg \'updateignoreskus\', updating ignore_skus.txt...');
          // Clear file and write skus to ignore
          Fs.truncate('ignore_skus.txt', 0, function() {
            let file = Fs.createWriteStream('ignore_skus.txt');
            file.on('error', function(err) { /* error handling */ });
            SKUS_NOT_ON_HOBISPORTS.forEach(function(sku) { file.write(sku + '\n'); });
            file.end();

            // Complete by outputting custom information
            TIME_END = new Date().toISOString();
            Logger.logSummary(TIME_START, TIME_END, SKUS, SKUS_QTY_UPDATED, SKUS_STOCK_STATUS_UPDATED, SKUS_NOT_ON_HOBISPORTS.length);
          });
          break;

        default:
          break;
      }
    } else {
      // Complete by outputting custom information
      TIME_END = new Date().toISOString();
      Logger.logSummary(TIME_START, TIME_END, SKUS, SKUS_QTY_UPDATED, SKUS_STOCK_STATUS_UPDATED, SKUS_NOT_ON_HOBISPORTS.length);
    }

  } catch (err) {
    Logger.logError(err);
    console.log(err);
  }
}

module.exports = run;
