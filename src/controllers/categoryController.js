import { Category } from "../models/index.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import ApiError from "../utils/APIError.js";

// Get root categories (parent_id is null)
const getRootCategories = asyncWrapper(async (req, res) => {
    const rootCategories = await Category.findAll({
        where: {
            parent_id: null
        },
        include: [{
            model: Category,
            as: 'subcategories',
            attributes: ['id', 'name', 'display_name']
        }],
        attributes: ['id', 'name', 'display_name']
    });

    return ApiResponse.success(res, 'Root categories fetched successfully', rootCategories);
});

// Get subcategories for a given category ID
const getSubCategories = asyncWrapper(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findByPk(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    const subCategories = await Category.findAll({
        where: {
            parent_id: categoryId
        },
        attributes: ['id', 'name', 'parent_id']
    });

    return ApiResponse.success(res, 'Subcategories fetched successfully', subCategories);
});

export {
    getRootCategories,
    getSubCategories
};