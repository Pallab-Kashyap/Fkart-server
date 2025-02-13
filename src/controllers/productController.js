
import { Category, Product, ProductVariation } from "../models/index.js";
import { Op } from "sequelize";
import ApiError from "../utils/APIError.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import { fetchSquareCatalogList } from "./squareController.js";
import { sequelize } from "../config/DBConfig.js";


const getCategoryByName = async (categoryName) => {
  let category = await Category.findOne({
    where: { name: categoryName },
    attributes: { exclude: ['createdAt', 'updatedAt', 'square_category_id'] },
  });

  if (!category) {
    const categories = await Category.findAll({
      where: {
        name: {
          [Op.like]: `%-${categoryName}`,
        },
      },
    });
    return categories.map((cat) => cat.id);
  }

  if (category.parent_id === null) {
    const subcategories = await Category.findAll({
      where: { parent_id: category.id },
    });
    return [category.id, ...subcategories.map((sub) => sub.id)];
  }

  return [category.id];
};

const fetchAndStoreProductFromSquare = asyncWrapper(async (req, res) => {
  const responseData = await fetchSquareCatalogList();
  const objects = responseData.data.objects;

  const items = objects.filter((obj) => obj.type === 'ITEM');

  for (const item of items) {
    const {
      id: square_product_id,
      item_data: {
        name: product_name,
        description,
        variations,
        image_ids,
        categories,
      },
    } = item;

    const categoryId = categories?.[0]?.id;
    const categoryObj = objects.find(
      (obj) => obj.type === 'CATEGORY' && obj.id === categoryId
    );
    const category = categoryObj?.category_data?.name?.toLowerCase() || null;

    const firstVariation = variations?.[0]?.item_variation_data;
    const price = firstVariation?.price_money?.amount || 0;

    const sku =
      variations?.map((v) => ({
        variation_id: v.id,
        name: v.item_variation_data.name,
        price: v.item_variation_data.price_money?.amount || 0,
      })) || [];

    const productData = {
      square_product_id,
      product_name,
      description,
      category,
      price: price / 100,
      sku: JSON.stringify(sku),
      image_url: image_ids?.[0] || null,
      quantity: 0,
    };

    try {
      await Product.upsert(productData, {
        where: { square_product_id },
        returning: true,
      });
    } catch (error) {
      console.error(`Error processing product ${product_name}:`, error);
    }
  }

  return ApiResponse.success(res, 'Products synchronized successfully', null);
});

const getAllProducts = asyncWrapper(async (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    size,
    color,
    sort = 'createdAt',
    order = 'DESC',
    page = 1,
    limit = 10,
    search,
  } = req.query;

  const whereClause = {};
  const variationWhereClause = {};

  if (category) {
    const categoryIds = await getCategoryByName(category);
    if (categoryIds?.length) {
      whereClause.category_id = { [Op.in]: categoryIds };
    }
  }

  if (search) whereClause.product_name = { [Op.iLike]: `%{search}%` };
  if (size) variationWhereClause.size = { [Op.in]: size.split(',') };
  if (color) variationWhereClause.color = color;
  if (minPrice) variationWhereClause.price = { [Op.gte]: minPrice };
  if (maxPrice)
    variationWhereClause.price = {
      ...variationWhereClause.price,
      [Op.lte]: maxPrice,
    };

  const products = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ProductVariation,
        as: 'variations',
        where: Object.keys(variationWhereClause).length
          ? variationWhereClause
          : undefined,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      {
        model: Category,
        as: 'category',
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'square_category_id'],
        },
      },
    ],
    order: [[sort, order]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    attributes: { exclude: ['square_product_id', 'updatedAt'] },
  });

  const processedProducts = products.rows.map((product) => {
    const data = product.toJSON();
    if (data.variations?.length) {
      data.variations = [data.variations[0]];
    } else {
      data.variations = [];
    }
    return data;
  });

  return ApiResponse.success(res, 'Products fetched successfully', {
    products: processedProducts,
    totalItems: products.count,
    totalPages: Math.ceil(products.count / limit),
    currentPage: Number(page),
  });
});

const getProductById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id, {
    include: [
      {
        model: ProductVariation,
        as: 'variations',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['createdAt', 'updatedAt', 'square_product_id'] },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return ApiResponse.success(res, 'Product fetched successfully', product);
});

const getProductsByCategory = asyncWrapper(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const categoryIds = await getCategoryByName(category);
  if (!categoryIds?.length) {
    throw new ApiError(404, 'Category not found');
  }

  const products = await Product.findAndCountAll({
    where: { category_id: { [Op.in]: categoryIds } },
    include: [
      {
        model: ProductVariation,
        as: 'variations',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'parent_id'],
      },
    ],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    attributes: { exclude: ['square_product_id', 'createdAt', 'updatedAt'] },
  });

  const processedProducts = products.rows.map((product) => {
    const data = product.toJSON();
    if (data.variations?.length) {
      data.variations = [data.variations[0]];
    } else {
      data.variations = [];
    }
    return data;
  });

  return ApiResponse.success(res, 'Products fetched successfully', {
    products: processedProducts,
    totalItems: products.count,
    totalPages: Math.ceil(products.count / limit),
    currentPage: Number(page),
  });
});

const searchProducts = asyncWrapper(async (req, res) => {
  const { q } = req.query;
  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { product_name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ],
    },
    include: [
      {
        model: ProductVariation,
        as: 'variations',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['square_product_id', 'createdAt', 'updatedAt'] },
  });

  if (products.length === 0) {
    return ApiResponse.success(res, 'No products found', []);
  }

  const processedProducts = products.map((product) => {
    const data = product.toJSON();
    if (data.variations?.length) {
      data.variations = [data.variations[0]];
    } else {
      data.variations = [];
    }
    return data;
  });

  return ApiResponse.success(res, 'Search results', processedProducts);
});

const getRelatedProducts = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const mainProduct = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'parent_id'],
        include: [
          {
            model: Category,
            as: 'parentCategory',
            attributes: ['id', 'name', 'parent_id'],
          },
        ],
      },
    ],
  });

  if (!mainProduct) {
    throw new ApiError(404, 'Product not found');
  }

  const rootCategoryId =
    mainProduct.category?.parent_id || mainProduct.category_id;

  const relatedProducts = await Product.findAll({
    where: {
      id: { [Op.ne]: id },
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'parent_id'],
        where: {
          [Op.or]: [
            { id: rootCategoryId },
            { parent_id: rootCategoryId },
          ],
        },
      },
      {
        model: ProductVariation,
        as: 'variations',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    order: sequelize.random(),
    limit: 4,
    attributes: { exclude: ['square_product_id', 'createdAt', 'updatedAt'] },
  });

  const processedProducts = relatedProducts.map((product) => {
    const data = product.toJSON();
    if (data.variations?.length) {
      data.variations = [data.variations[0]];
    } else {
      data.variations = [];
    }
    return data;
  });

  return ApiResponse.success(
    res,
    'Related products fetched successfully',
    processedProducts
  );
});

export {
  fetchAndStoreProductFromSquare,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getRelatedProducts,
};
