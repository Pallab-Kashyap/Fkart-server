// // import { Router } from 'express'
// const express = require('express');
// const router = express.Router();
// const addressController = require('../controllers/addressController');

// router.post('/', addressController.createAddress);
// router.get('/', addressController.getAddresses);
// router.put('/:id', addressController.updateAddress);
// router.delete('/:id', addressController.deleteAddress);
// router.post('/setdefault/:id', addressController.setDefaultAddress);

// module.exports = router;
import express from 'express';
const router = express.Router();
// import addressController from '../controllers/addressController.js';
// import  addressController from '../controllers/addressController';
import { createAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController.js';
router.post('/', createAddress);
router.get('/', getAddresses);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.post('/setdefault/:id', setDefaultAddress);

export default router;