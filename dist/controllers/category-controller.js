"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = getAllCategories;
exports.getCategoryById = getCategoryById;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const Category_1 = require("../models/Category");
/**
 * Get all categories
 */
async function getAllCategories(req, res) {
    try {
        const { isActive } = req.query;
        // Build filter object based on query parameters
        const filter = {};
        // Active filter
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }
        // Get categories sorted by display order
        const categories = await Category_1.Category.find(filter).sort({ displayOrder: 1 });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
}
/**
 * Get a category by its ID
 */
async function getCategoryById(req, res) {
    try {
        const category = await Category_1.Category.findById(req.params.id);
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching category' });
    }
}
/**
 * Create a new category
 */
async function createCategory(req, res) {
    try {
        // Tạm thời bỏ kiểm tra admin cho việc testing
        // Trong môi trường production thì nên bật lại
        /*
        if (req.user && req.user.role !== 'admin') {
          res.status(403).json({ message: 'Admin access required' });
          return;
        }
        */
        const { name, description, slug, image, isActive, displayOrder } = req.body;
        // Validate required fields
        if (!name || !description) {
            res.status(400).json({ message: 'Name and description are required' });
            return;
        }
        // Check if slug already exists
        if (slug) {
            const existingCategory = await Category_1.Category.findOne({ slug });
            if (existingCategory) {
                res.status(400).json({ message: 'A category with this slug already exists' });
                return;
            }
        }
        // Create new category
        const category = new Category_1.Category({
            name,
            description,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            image,
            isActive: isActive !== undefined ? isActive : true,
            displayOrder: displayOrder || 0
        });
        await category.save();
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
}
/**
 * Update a category
 */
async function updateCategory(req, res) {
    try {
        // Tạm thời bỏ kiểm tra admin cho việc testing
        /*
        if (req.user && req.user.role !== 'admin') {
          res.status(403).json({ message: 'Admin access required' });
          return;
        }
        */
        const { name, description, slug, image, isActive, displayOrder } = req.body;
        // Validate required fields
        if (!name || !description) {
            res.status(400).json({ message: 'Name and description are required' });
            return;
        }
        // If slug is being changed, check if new slug already exists
        if (slug) {
            const existingCategory = await Category_1.Category.findOne({
                slug,
                _id: { $ne: req.params.id }
            });
            if (existingCategory) {
                res.status(400).json({ message: 'A category with this slug already exists' });
                return;
            }
        }
        // Update category
        const category = await Category_1.Category.findByIdAndUpdate(req.params.id, {
            name,
            description,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            image,
            isActive,
            displayOrder
        }, { new: true, runValidators: true });
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json(category);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
}
/**
 * Delete a category
 * Note: This will fail if menu items are using this category
 */
async function deleteCategory(req, res) {
    try {
        // Tạm thời bỏ kiểm tra admin cho việc testing
        /*
        if (req.user && req.user.role !== 'admin') {
          res.status(403).json({ message: 'Admin access required' });
          return;
        }
        */
        const category = await Category_1.Category.findByIdAndDelete(req.params.id);
        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        // If error is a reference constraint, provide a more helpful message
        if (error.name === 'MongoError' && error.code === 16759) {
            res.status(400).json({
                message: 'Cannot delete category because it is being used by menu items'
            });
        }
        else {
            res.status(500).json({
                message: 'Error deleting category',
                error: error.message
            });
        }
    }
}
