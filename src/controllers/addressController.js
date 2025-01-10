
import Address  from '../models/userAddress.js';
import { sequelize } from '../config/DBConfig.js';
// console.log('Address:', Address); 
// console.log('Sequelize:', sequelize);  
export const createAddress = async (req, res) => {
  try {
    const address = await Address.create(req.body);
    res.status(201).json(address);
  } catch (error) {
    console.error(`error is ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};   

export const getAddresses = async (req, res) => {
  try {
    const where = {};
    if (req.query.user_id) { 
      where.user_id = req.query.user_id;
    }
    const addresses = await Address.findAll({ where });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Address.update(req.body, {
      where: { id }
    });
    if (updated) {
      const updatedAddress = await Address.findByPk(id);
      res.json(updatedAddress);
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Address.destroy({
      where: { id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.transaction(async (t) => {
      await Address.update({ isDefault: false }, { where: {}, transaction: t });
      await Address.update({ isDefault: true }, { where: { id }, transaction: t });
    });
    res.status(200).json({ message: 'Default address updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};