import {
  Category,
  Product,
  ProductVariation,
  Review,
} from '../models/index.js';
import { Op } from 'sequelize';
import ApiError from '../utils/APIError.js';
import ApiResponse from '../utils/APIResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { fetchSquareCatalogList } from './squareController.js';
import { sequelize } from '../config/DBConfig.js';

const buildFilterConditions = ({
  minPrice,
  maxPrice,
  size,
  color,
  search,
  inStock,
  rating,
  brand,
}) => {
  const whereClause = {};
  const variationWhereClause = {};
  const ratingWhereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { product_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (inStock) variationWhereClause.stock_quantity = { [Op.gt]: 0 };
  if (rating) {
    let intRating = Math.floor(rating);
    ratingWhereClause.rating = { [Op.gte]: intRating };
  }
  // if (brands) whereClause.brand = { [Op.in]: brands.split(',') };

  if (size) variationWhereClause.size = { [Op.in]: size.split(',') };
  if (color) variationWhereClause.color = { [Op.in]: color.split(',') };

  if (minPrice || maxPrice) {
    variationWhereClause.price = {};
    if (minPrice) variationWhereClause.price[Op.gte] = minPrice;
    if (maxPrice) variationWhereClause.price[Op.lte] = maxPrice;
  }

  return { whereClause, variationWhereClause, ratingWhereClause };
};

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

const calculateRating = (data) => {
  const numberOfReviews = data.Reviews?.length || 0;
  const totalRatting =
    data.Reviews?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
  const rating =
    numberOfReviews > 0 ? (totalRatting / numberOfReviews).toFixed(2) : 0;

  return {
    rating: parseFloat(rating),
    numberOfReviews,
  };
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
    search,
    inStock,
    rating,
    brands,
    sort,
    order, 
    page = 1,
    limit = 10,
  } = req.query;

  const { whereClause, variationWhereClause, ratingWhereClause } =
    buildFilterConditions({
      minPrice,
      maxPrice,
      size,
      color,
      search,
      inStock,
      rating,
      brands,
    });

  if (category) {
    const categoryIds = await getCategoryByName(category);
    if (categoryIds?.length) {
      whereClause.category_id = { [Op.in]: categoryIds };
    }
  }

  let sortOrder = [sequelize.random()];
  if (sort) {
    sortOrder = sort.split(',').map((field) => {
      const [name, direction = order] = field.split(':');
      return [name, direction.toUpperCase()];
    });
  }

  let isReviewRequired = false;

  if (rating) {
    isReviewRequired = true;
  }

  const variations = await ProductVariation.findAndCountAll({
    where: variationWhereClause,
    include: [
      {
        model: Product,
        as: 'product',
        where: whereClause,
        include: [
          {
            model: Review,
            where: ratingWhereClause,
            required: isReviewRequired,
          },
        ],
        attributes: [
          'id',
          'product_name',
          'description',
          'image_url',
          'category_id',
          'createdAt'
        ],
      },
    ],
    order: sortOrder,
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    attributes: [
      'id',
      'product_id',
      'size',
      'color',
      'price',
      'stock_quantity',
      'in_stock',
      'image_url',
      'createdAt'
    ],
  });

  const processedProducts = variations.rows.map((variation) => {
    const variationData = variation.toJSON();
    const product = variationData.product;

    // Calculate rating for the product
    const rating = calculateRating({
      Reviews: product.Reviews || [],
    });

    return {
      id: product.id,
      product_name: product.product_name,
      description: product.description,
      image_url: product.image_url,
      category_id: product.category_id,
      rating,
      variation: {
        id: variationData.id,
        product_id: variationData.product_id,
        size: variationData.size,
        color: variationData.color,
        price: variationData.price,
        stock_quantity: variationData.stock_quantity,
        in_stock: variationData.in_stock,
        image_url: variationData.image_url,
      },
    };
  });

  return ApiResponse.success(res, 'Products fetched successfully', {
    products: processedProducts,
    totalItems: variations.count,
    totalPages: Math.ceil(variations.count / limit),
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
      {
        model: Review,
        attributes: ['rating'],
        required: false,
      },
    ],
    attributes: { exclude: ['updatedAt', 'square_product_id'] },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const productData = product.toJSON();

  if (productData.Review) {
    productData.Reviews = calculateRating(productData);
  }

  return ApiResponse.success(res, 'Product fetched successfully', productData);
});

const getProductsByCategory = asyncWrapper(async (req, res) => {
  const { category } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'DESC',
    minPrice,
    maxPrice,
    size,
    color,
    inStock,
    rating,
    brands,
  } = req.query;

  const categoryIds = await getCategoryByName(category);
  if (!categoryIds?.length) {
    throw new ApiError(404, 'Category not found');
  }

  const { whereClause, variationWhereClause } = buildFilterConditions({
    minPrice,
    maxPrice,
    size,
    color,
    inStock,
    rating,
    brands,
  });

  whereClause.category_id = { [Op.in]: categoryIds };

  const sortOrder = sort.split(',').map((field) => {
    const [name, direction = order] = field.split(':');
    return [name, direction.toUpperCase()];
  });

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
        attributes: ['id', 'name', 'parent_id'],
        required: false,
      },
      {
        model: Review,
        attributes: ['rating'],
      },
    ],
    order: sortOrder,
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

    if (data.Review) {
      data.Reviews = calculateRating(data);
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
  return getAllProducts(req, res);
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
          [Op.or]: [{ id: rootCategoryId }, { parent_id: rootCategoryId }],
        },
      },
      {
        model: ProductVariation,
        as: 'variations',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      {
        model: Review,
        attributes: ['rating'],
        required: false,
      },
    ],
    order: sequelize.random(),
    limit: 4,
    attributes: { exclude: ['square_product_id', 'updatedAt'] },
  });

  const processedProducts = relatedProducts.map((product) => {
    const data = product.toJSON();
    if (data.variations?.length) {
      data.variations = [data.variations[0]];
    } else {
      data.variations = [];
    }

    if (data.Review) {
      data.Reviews = calculateRating(data);
    }
    return data;
  });

  return ApiResponse.success(
    res,
    'Related products fetched successfully',
    processedProducts
  );
});

const getProductVariationsStock = asyncWrapper(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Valid variation IDs array is required');
  }

  const variations = await ProductVariation.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    attributes: ['id', 'stock_quantity', 'in_stock'],
  });

  const stockInfo = variations.reduce((acc, variation) => {
    acc[variation.id] = {
      stock_quantity: variation.stock_quantity,
      in_stock: variation.in_stock,
    };
    return acc;
  }, {});

  return ApiResponse.success(
    res,
    'Stock information fetched successfully',
    stockInfo
  );
});

export {
  fetchAndStoreProductFromSquare,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getRelatedProducts,
  getProductVariationsStock, // Add this export
};
