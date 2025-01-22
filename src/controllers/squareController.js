// import express from 'express';
// import cors from 'cors';

// const app = express();

// app.use(cors(
//     {
//         origin: '*',
//         credentials: true
//     }
// ));

// const clientId = 'sq0idp-ms5wjvnCTGkpngtVeD826g';
// const redirectUri = 'http://localhost:3000/callback';
// const scopes = 'ITEMS_READ+ITEMS_WRITE+INVENTORY_READ+INVENTORY_WRITE+MERCHANT_PROFILE_READ+MERCHANT_PROFILE_WRITE+VENDOR_READ+VENDOR_WRITE';
// console.log(encodeURIComponent(scopes));
// app.get('/authorize', (req, res) => {
//     const authorizeUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=${scopes}&session=False&state=82201dd8d83d23cc8a48caf52b`;
//     res.redirect(authorizeUrl);
// });

//     app.get('/callback', async (req, res) => {
//         const authorizationCode = req.query.code;

//         if (!authorizationCode) {
//             return res.status(400).send('Authorization failed.');
//         }

//         const tokenUrl = 'https://connect.squareup.com/oauth2/token';
//         const clientSecret = 'sq0csp-eQXOrdJAOeEpt9u49k0xHRtvKvt7QT5dXHz2JwThsAU';

//         const body = {
//             client_id: clientId,
//             client_secret: clientSecret,
//             code: authorizationCode,
//             grant_type: 'authorization_code',
//             redirect_uri: redirectUri
//         };

//         try {
//             const response = await fetch(tokenUrl, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(body)
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 const accessToken = data.access_token;
//                 const refreshToken = data.refresh_token;
//                 console.log(data);
//                 res.send('Authorization successful.');
//             } else {
//                 res.status(400).send('Token exchange failed.');
//             }
//         } catch (error) {
//             res.status(500).send('Internal Server Error');
//         }
//     });

//     app.get('/list-items', async (req, res) => {
//         const accessToken = 'EAAAlqYDG1Yu_chRt5D3bzHJUNfzjUuTWt1IP6Psy9XaWIW87GqDDlx3noMKfyl1'

//         try {
//             const response = await fetch('https://connect.squareup.com/v2/catalog/list', {
//                 method: 'GET',
//                 headers: {

//                     'Authorization': `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json'
//                 }
//             });
//             const data = await response.json();
//             console.log(data);

//             if (response.ok) {
//                 res.json(data);
//             } else {
//                 res.status(400).send(response);
//             }
//         } catch (error) {
//             res.status(500).send('Internal Server Error');
//         }
//     });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });
// // https://app.squareup.com/oauth2/authorize?client_id=sandbox-sq0idb-HRODd85bturjAZ4IH7U_Tg&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=ITEMS_READ%20ITEMS_WRITE%20INVENTORY_READ%20INVENTORY_WRITE

import { Client, Environment, ApiError as squareApiError } from 'square';
import asyncWrapper from '../utils/asyncWrapper.js';
import SquareData from '../models/squareDataModel.js';
import ApiError from '../utils/APIError.js';
import crypto from 'crypto';
import ApiResponse from '../utils/APIResponse.js';

const squareClient = new Client({
  environment: Environment.Production,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

const ENCRYPTION_KEY = crypto.randomBytes(32);
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
  const { code } = req.query;
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;

  try {
    const { result } = await squareClient.oAuthApi.obtainToken({
      clientId: process.env.SQUARE_APPLICATION_ID,
      clientSecret: clientSecret,
      code: code,
      grantType: 'authorization_code',
    });

    const { accessToken, expiresAt, merchantId, refreshToken } = result;

    const { encryptedData, iv } = encryptToken(accessToken, refreshToken);
    console.log(accessToken, refreshToken, encryptedData, iv);
    try {
      const data = await SquareData.create({
        token: encryptedData,
        iv,
        expire_at: expiresAt,
        merchant_id: merchantId,
      });
      ApiResponse.created(res, 'OAuth flow completed', null);
    } catch (error) {
      return ApiError.internal('Error storing token');
    }
  } catch (error) {
    res.status(500).send('Error during OAuth flow');
  }
});

const getItems = asyncWrapper(async (req, res) => {
  const accessToken = req.headers.authorization.split(' ')[1];
  const response = await squareClient.catalogApi.listCatalog();
  const catalogData = response.result;

  // Serialize the catalog data
  const serializedData = JSON.stringify(catalogData, replacer);
  console.log('Serialized Data:', serializedData);
  // Simulate storing in a database
  // In a real application, you'd store `serializedData` in your database
  
  // Simulate retrieving from a database
  const retrievedData = JSON.parse(serializedData, reviver);
  ApiResponse.success(res, 'Items fetched successfully', serializedData);
  console.log('Retrieved Data:', retrievedData);
});


// Replacer function for JSON.stringify to handle BigInt serialization
const replacer = (key, value) =>
  typeof value === "bigint" ? { $bigint: value.toString() } : value;

// Reviver function for JSON.parse to handle BigInt deserialization
const reviver = (key, value) =>
  value !== null &&
  typeof value === "object" &&
  "$bigint" in value &&
  typeof value.$bigint === "string"
    ? BigInt(value.$bigint)
    : value;

// Function to fetch catalog list
async function fetchCatalogList() {
  try {
    const response = await client.catalogApi.listCatalog();
    const catalogData = response.result;

    // Serialize the catalog data
    const serializedData = JSON.stringify(catalogData, replacer);
    console.log('Serialized Data:', serializedData);
    ApiResponse.success(res, 'Items fetched successfully', serializedData);
    // Simulate storing in a database
    // In a real application, you'd store `serializedData` in your database

    // Simulate retrieving from a database
    const retrievedData = JSON.parse(serializedData, reviver);
    console.log('Retrieved Data:', retrievedData);

    // Use the retrieved data as needed
  } catch (error) {
    console.error('Error fetching catalog list:', error);
  }
}


export { authorizeSquare, squareCallback, getItems };
