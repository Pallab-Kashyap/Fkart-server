import { Product } from "../models/index.js";
import ApiError from "../utils/APIError.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import { fetchSquareCatalogList } from "./squareController.js";


const fetchAndStoreProductFromSquare = asyncWrapper(async (req, res) => {
    const responseData = await fetchSquareCatalogList();
    const objects = responseData.data.objects;

    const items = objects.filter(obj => obj.type === 'ITEM');
    
    for (const item of items) {
        const {
            id: square_product_id,
            item_data: {
                name: product_name,
                description,
                variations,
                image_ids,
                categories
            }
        } = item;


        const categoryId = categories?.[0]?.id;
        const categoryObj = objects.find(obj => obj.type === 'CATEGORY' && obj.id === categoryId);
        const category = categoryObj?.category_data?.name?.toLowerCase() || null;


        const firstVariation = variations?.[0]?.item_variation_data;
        const price = firstVariation?.price_money?.amount || 0;
        

        const sku = variations?.map(v => ({
            variation_id: v.id,
            name: v.item_variation_data.name,
            price: v.item_variation_data.price_money?.amount || 0
        })) || [];


        const productData = {
            square_product_id,
            product_name,
            description,
            category,
            price: price / 100, 
            sku: JSON.stringify(sku),
            image_url: image_ids?.[0] || null,
            quantity: 0 
        };

        try {

            await Product.upsert(productData, {
                where: { square_product_id },
                returning: true
            });
        } catch (error) {
            console.error(`Error processing product ${product_name}:`, error);
        }
    }

    return ApiResponse.success(res, 'Products synchronized successfully', null);
});

// Get all products
const getAllProducts = asyncWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({})
        .skip(skip)
        .limit(limit);
        
    if(!products) throw ApiError.internal('error in fetching products from db')
        
    ApiResponse.success(res, '', products)
    
    res.status(500).send(error);
    
})

// Get a single product by ID
const getProductById = asyncWrapper( async (req, res) => {
        const productId = req.params.id;
        if(!productId)
            throw ApiError.badRequest('productId needed')

        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound(`product with id: ${productId}, doesn't exist`)
        }
        ApiResponse(res, '', product)
});


const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).send();
        }
        res.status(200).send(product);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send();
        }
        res.status(200).send(product);
    } catch (error) {
        res.status(500).send(error);
    }
};

export {
    fetchAndStoreProductFromSquare,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
}