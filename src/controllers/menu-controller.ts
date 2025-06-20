import { Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';

// Extend Express Request type to include 'lang'
declare global {
  namespace Express {
    interface Request {
      lang?: string;
    }
  }
}

// Helper function and language constants
const supportedLanguages = ['en', 'vi'];
const fallbackLanguage = 'en';
const getLocalizedField = (field: { en: string; vi: string; } | undefined, lang: string | undefined, fallbackLang: string = 'en'): string => {
  if (!field) return '';
  if (lang && supportedLanguages.includes(lang) && field[lang as keyof typeof field]) {
    return field[lang as keyof typeof field];
  }
  return field[fallbackLang as keyof typeof field] || '';
};

/**
 * Get all menu items, with optional category filter
 */
export async function getAllMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { 
      category,
      maxCalories,
      minProtein,
      maxProtein,
      minCalories
    } = req.query;
    
    // Build filter object based on query parameters
    const filter: any = {};
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Nutrition filters
    if (minCalories || maxCalories || minProtein || maxProtein) {
      filter.nutritionInfo = {};
      
      // Calories range
      if (minCalories) {
        filter.nutritionInfo['calories'] = { $gte: Number(minCalories) };
      }
      if (maxCalories) {
        filter.nutritionInfo['calories'] = { 
          ...filter.nutritionInfo['calories'], 
          $lte: Number(maxCalories) 
        };
      }
      
      // Protein range
      if (minProtein) {
        filter.nutritionInfo['protein'] = { $gte: Number(minProtein) };
      }
      if (maxProtein) {
        filter.nutritionInfo['protein'] = { 
          ...filter.nutritionInfo['protein'], 
          $lte: Number(maxProtein) 
        };
      }
    }
    
    const menuItems = await MenuItem.find(filter).populate('category', 'name slug');
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items' });
  }
}

/**
 * Search menu items by query text
 * Searches across name, description, and ingredients
 * Also supports filtering by category and nutritional content
 */
export async function searchMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { 
      query, 
      category,
      minCalories, 
      maxCalories, 
      minProtein, 
      maxProtein,
      sort = 'name',
      order = 'asc',
      limit = 20,
      page = 1
    } = req.query;

    if (!query) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    // Build search filter
    const searchFilter: any = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { ingredients: { $regex: query, $options: 'i' } }
      ]
    };

    // Add category filter if provided
    if (category) {
      searchFilter.category = category;
    }

    // Add nutritional filters if provided
    if (minCalories || maxCalories) {
      searchFilter['nutritionInfo.calories'] = {};
      if (minCalories) searchFilter['nutritionInfo.calories'].$gte = Number(minCalories);
      if (maxCalories) searchFilter['nutritionInfo.calories'].$lte = Number(maxCalories);
    }

    if (minProtein || maxProtein) {
      searchFilter['nutritionInfo.protein'] = {};
      if (minProtein) searchFilter['nutritionInfo.protein'].$gte = Number(minProtein);
      if (maxProtein) searchFilter['nutritionInfo.protein'].$lte = Number(maxProtein);
    }

    // Build sort options
    const sortOptions: any = {};
    // Set the sort field based on query parameter
    switch (sort) {
      case 'price':
        sortOptions.price = order === 'desc' ? -1 : 1;
        break;
      case 'calories':
        sortOptions['nutritionInfo.calories'] = order === 'desc' ? -1 : 1;
        break;
      case 'protein':
        sortOptions['nutritionInfo.protein'] = order === 'desc' ? -1 : 1;
        break;
      default:
        sortOptions.name = order === 'desc' ? -1 : 1;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const numLimit = Number(limit);

    // Execute query with pagination and sorting
    const [menuItems, total] = await Promise.all([
      MenuItem.find(searchFilter)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(numLimit),
      MenuItem.countDocuments(searchFilter)
    ]);

    // Return results with pagination metadata
    res.json({
      items: menuItems,
      pagination: {
        total,
        page: Number(page),
        limit: numLimit,
        pages: Math.ceil(total / numLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching menu items' });
  }
}

/**
 * Get menu items filtered by nutritional content
 * Allows filtering by calories and protein ranges
 */
export async function getNutritionalMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const { 
      minCalories = 0, 
      maxCalories = 5000, 
      minProtein = 0, 
      maxProtein = 200
    } = req.query;
    
    const menuItems = await MenuItem.find({
      'nutritionInfo.calories': { 
        $gte: Number(minCalories), 
        $lte: Number(maxCalories) 
      },
      'nutritionInfo.protein': { 
        $gte: Number(minProtein), 
        $lte: Number(maxProtein) 
      }
    });
    
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items by nutrition info' });
  }
}

/**
 * Get a menu item by its ID
 */
export async function getMenuItemById(req: Request, res: Response): Promise<void> {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('category', 'name slug description');
    if (!menuItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu item' });
  }
}

/**
 * Create a new menu item (admin only)
 */
export async function createMenuItem(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ 
        status: 'error',
        message: 'Admin access required',
        error: 'This endpoint requires an admin role. Your current role is: ' + (req.user?.role || 'undefined')
      });
      return;
    }

    // Log the request body to help debug
    console.log('Attempting to create menu item with data:', JSON.stringify(req.body, null, 2));

    // Validate that the category exists
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid category',
          error: `Category with ID ${req.body.category} does not exist`
        });
        return;
      }
    }

    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    const populatedMenuItem = await MenuItem.findById(menuItem._id).populate('category', 'name slug');
    res.status(201).json(populatedMenuItem);
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    
    // Send more detailed error information
    res.status(400).json({ 
      status: 'error',
      message: 'Error creating menu item',
      error: error.message,
      // If it's a validation error, include the validation details
      validationErrors: error.name === 'ValidationError' ? 
        Object.keys(error.errors).reduce((acc: any, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}) : undefined
    });
  }
}

/**
 * Update an existing menu item (admin only)
 */
export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- UPDATE MENU ITEM DEBUG ---');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body (raw):', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Is body empty?', Object.keys(req.body).length === 0);
    console.log('Request params:', req.params);
    console.log('-------------------------------');

    if (req.user?.role !== 'admin') {
      res.status(403).json({ 
        status: 'error',
        message: 'Admin access required',
        error: 'This endpoint requires an admin role. Your current role is: ' + (req.user?.role || 'undefined')
      });
      return;
    }

    // Log the update request for debugging
    console.log(`Update request for menu item ${req.params.id}:`, JSON.stringify(req.body, null, 2));
    
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ 
        status: 'error',
        message: 'No update data provided',
        error: 'Request body is empty or improperly formatted'
      });
      return;
    }

    // Validate that the category exists if it's being updated
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid category',
          error: `Category with ID ${req.body.category} does not exist`
        });
        return;
      }
    }

    // Convert price from string to number if needed
    if (req.body.price && typeof req.body.price === 'string') {
      req.body.price = parseFloat(req.body.price);
      console.log('Converted price from string to number:', req.body.price);
    }

    // Make sure number fields have proper types
    if (req.body.nutritionInfo) {
      ['calories', 'protein', 'carbs', 'fat'].forEach(field => {
        if (req.body.nutritionInfo[field] && typeof req.body.nutritionInfo[field] === 'string') {
          req.body.nutritionInfo[field] = parseFloat(req.body.nutritionInfo[field]);
        }
      });
    }

    if (req.body.preparationTime && typeof req.body.preparationTime === 'string') {
      req.body.preparationTime = parseInt(req.body.preparationTime, 10);
    }

    // Try a different update method if using direct update
    if (req.body.price !== undefined && Object.keys(req.body).length === 1) {
      try {
        // Alternative direct update approach just for price
        const result = await MenuItem.updateOne(
          { _id: req.params.id },
          { $set: { price: req.body.price } }
        );
        console.log('Direct price update result:', result);

        if (result.matchedCount === 0) {
          res.status(404).json({ 
            status: 'error',
            message: 'Menu item not found',
            itemId: req.params.id
          });
          return;
        }

        // Fetch the updated item to return
        const updatedItem = await MenuItem.findById(req.params.id).populate('category', 'name slug');
        console.log('Price updated successfully using alternative method:', updatedItem);
        
        res.json({
          status: 'success',
          message: 'Menu item price updated successfully',
          data: updatedItem
        });
        return;
      } catch (error) {
        console.error('Error with alternative price update:', error);
        // Continue to regular update method if this fails
      }
    }

    const updateOptions = { 
      new: true,      // Return the updated document
      runValidators: true  // Run model validators
    };

    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      updateOptions
    ).populate('category', 'name slug');

    if (!menuItem) {
      res.status(404).json({ 
        status: 'error',
        message: 'Menu item not found',
        itemId: req.params.id
      });
      return;
    }

    console.log('Menu item updated successfully:', menuItem);
    
    res.json({
      status: 'success',
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    
    res.status(400).json({ 
      status: 'error',
      message: 'Error updating menu item',
      error: error.message,
      validationErrors: error.name === 'ValidationError' ? 
        Object.keys(error.errors).reduce((acc: any, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}) : undefined
    });
  }
}

/**
 * Delete a menu item (admin only)
 */
export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ 
        status: 'error',
        message: 'Admin access required',
        error: 'This endpoint requires an admin role. Your current role is: ' + (req.user?.role || 'undefined')
      });
      return;
    }

    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item' });
  }
} 