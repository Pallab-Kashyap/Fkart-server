import { Category } from "../models/index.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncWrapper from "../utils/asyncWrapper.js";

const buildCategoryTree = (categories, parentId = null) => {
    const categoryMap = {};
    categories.forEach(category => {
        const { id, name, display_name, parent_id } = category;
        categoryMap[id] = {
            id,
            name,
            display_name,
            parent_id,
            children: []
        };
    });

    const rootCategories = [];
    categories.forEach(category => {
        if (category.parent_id === parentId) {
            rootCategories.push(categoryMap[category.id]);
        } else {
            categoryMap[category.parent_id]?.children.push(categoryMap[category.id]);
        }
    });

    return rootCategories;
};

const getAllCategories = asyncWrapper(async (req, res) => {
    const categories = await Category.findAll({
        attributes: ['id', 'name', 'display_name', 'parent_id'],
        order: [['parent_id', 'ASC']]
    });
    const hierarchicalCategories = buildCategoryTree(categories);
    return ApiResponse.success(res, 'All categories fetched successfully', hierarchicalCategories);
});

const getRootCategories = asyncWrapper(async (req, res) => {
    const rootCategories = await Category.findAll({
        attributes: ['id', 'name', 'display_name', 'parent_id'],
        where: {
            parent_id: null
        },
    });

    return ApiResponse.success(res, 'Root categories fetched successfully', rootCategories);
});

const getSubCategories = asyncWrapper(async (req, res) => {
    const { parent_id } = req.params;

    const allSubCategories = await Category.findAll({
        attributes: ['id', 'name', 'display_name', 'parent_id'],
        where: {},
        order: [['parent_id', 'ASC']]
    });

    // Filter categories starting from the given parent_id
    const hierarchicalCategories = buildCategoryTree(allSubCategories, parent_id);

    return ApiResponse.success(res, 'Subcategories fetched successfully', hierarchicalCategories);
});

export {
    getAllCategories,
    getRootCategories,
    getSubCategories
};