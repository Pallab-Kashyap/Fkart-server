import { Client, Environment, ApiError as squareApiError } from 'square';
import asyncWrapper from '../utils/asyncWrapper.js';
import { SquareData } from '../models/index.js';
import ApiError from '../utils/APIError.js';
import crypto from 'crypto';
import ApiResponse from '../utils/APIResponse.js';

const squareClient = new Client({
  environment: Environment.Production,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

const ENCRYPTION_KEY = process.env.SQUARE_ENCRYPTION_KEY;
const IV = crypto.randomBytes(16);

function encryptToken(accessToken, refreshToken) {
  const combinedToken = `${accessToken}:${refreshToken}`;
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(combinedToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    iv: IV.toString('hex'),
  };
}

function decryptToken(encryptedData, iv) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted.split(':');
}

const authorizeSquare = asyncWrapper(async (req, res) => {
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const scopes =
    'ITEMS_READ+ITEMS_WRITE+INVENTORY_READ+INVENTORY_WRITE+MERCHANT_PROFILE_READ+MERCHANT_PROFILE_WRITE+VENDOR_READ+VENDOR_WRITE';
  const squareBaseURL = process.env.SQUARE_BASE_URL;

  const authorizationUrl = `${squareBaseURL}/oauth2/authorize?client_id=${applicationId}&scope=${scopes}&session=False&state=82201dd8d83d23cc8a48caf52b`;

  res.redirect(authorizationUrl);
});

const squareCallback = asyncWrapper(async (req, res) => {
  console.log('ENT');
  const { code } = req.query;
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;
  const clientId = process.env.SQUARE_APPLICATION_ID;
  // console.log(code, clientSecret, clientId);
  try {
    const { result } = await squareClient.oAuthApi.obtainToken({
      clientId,
      clientSecret,
      code,
      grantType: 'authorization_code',
    });
    console.log('GOT TOKEN FROM SQUARE');
    const { accessToken, expiresAt, merchantId, refreshToken } = result;

    const { encryptedData, iv } = encryptToken(accessToken, refreshToken);
    console.log('ENCRYPTED DATA');
    // console.log(accessToken, refreshToken, encryptedData, iv);
    try {
      const data = await SquareData.create({
        token: encryptedData,
        iv,
        expire_at: expiresAt,
        merchant_id: merchantId,
      });
      if (!data)
        throw ApiError.internal('problem in storing data in SquareData DB');
      console.log('STORED TOKEN');
      ApiResponse.created(res, 'OAuth flow completed', null);
    } catch (error) {
      console.log('ERROR STORING TOKEN');
      console.log(error);
      ApiError.internal('Error storing token');
    }
  } catch (error) {
    console.log('GOT ERROR FROM SQUARE');
    console.log(error);
    res.status(500).send(`Error during OAuth flow: ${error}`);
  }
});

const fetchSquareClientTokensFromDB = async () => {
  try {
    const data = await SquareData.findOne();
    if (!data)
      throw ApiError.internal(
        'No sqauare token found in database, first register the merchant'
      );
    const { token, iv } = data;
    const [accessToken, refreshToken] = decryptToken(token, iv);
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw ApiError.internal(
      `Error fetching data from SquareData: ${error.message}`
    );
  }
};

const fetchSquareInventory = async (catalogObjectIds) => {
  try {
    const response =
      await squareClient.inventoryApi.batchRetrieveInventoryCounts({
        catalogObjectIds,
      });
    // .then(response => response.json());

    console.log('INVENTORY RESPONSE', response.result.counts);
    return response.result.counts;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw new Error('Failed to fetch inventory');
  }
};

const fetchSquareCatalogList = async () => {
  const { accessToken } = await fetchSquareClientTokensFromDB();

  try {
    const squareBaseUrl = process.env.SQUARE_BASE_URL;
    let catalogResponse = await fetch(`${squareBaseUrl}/v2/catalog/list`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!catalogResponse.ok) {
      // const errorBody = await res.text();
      throw ApiError.internal(`Square API Error: ${catalogResponse.status}}`);
    }
    catalogResponse = await catalogResponse.json();
    // console.log(catalogResponse);

    const catalogItems = catalogResponse.objects;
    catalogItems.forEach(element => {
      console.log(element.id);
      
    });
    
    return

    const catalogObjectIds = catalogItems.map((item) => item.id);
    console.log(catalogObjectIds);

    const inventory = await fetchSquareInventory(catalogObjectIds);
    console.log(inventory);

    const catalogWithInventory = catalogItems.map((item) => {
      // console.log(item.id);
      const itemInventory = inventory.find(
        (inv) => inv.catalogObjectId === item.id
      );
      // console.log(itemInventory);
      return;
      return {
        name: item.item_data.name,
        variation:
          item.item_data.variations?.[0]?.item_variation_data.name || 'Default',
        price:
          item.item_data.variations?.[0]?.item_variation_data.price_money
            ?.amount || 0,
        quantity: itemInventory ? itemInventory.quantity : 'N/A',
      };
    });
  } catch (error) {
    throw ApiError.internal(`Error fetching data from Square: ${error}`);
  }
};

export { authorizeSquare, squareCallback, fetchSquareCatalogList };
