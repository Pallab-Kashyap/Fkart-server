// import express from 'express';
// import cors from 'cors';
// import e from 'express';

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