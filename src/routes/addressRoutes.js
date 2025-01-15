
import express from 'express';
const router = express.Router();
// import addressController from '../controllers/addressController.js';
// import  addressController from '../controllers/addressController';
// add ------------------------------------------------------------------------------------done
// fetch-----------------------------------------------------------------------------------done
// update----------------------------------------------------------------------------------done
// remove----------------------------------------------------------------------------------done
// set default

import { createAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController.js';
import auth from '../middlewares/authMiddleware.js';

router.route('/').post( auth, createAddress)
//                 .get('/', getAddresses)
// router.route('/:id').put( updateAddress)
//                     .delete('/:id', deleteAddress);
// router.post('/setdefault/:id', setDefaultAddress); 
router.get('/', auth, getAddresses); 
router.put('/:id', auth, updateAddress);
router.delete('/:id', auth, deleteAddress);
router.post('/setdefault/:id', auth, setDefaultAddress); 
 

export default router;