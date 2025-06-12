import { Request, Response } from 'express';
import { Category } from '../models/Category';

// Extend Express Request type to include 'lang'
declare global {
  namespace Express {
    interface Request {
      lang?: string;
    }
  }
}

// Helper function to get the localized field based on language
const getLocalizedField = (field: { en: string; vi: string; } | undefined, lang: string | undefined, fallbackLang: string = 'en'): string => {
  if (!field) return '';
  if (lang && ['en', 'vi'].includes(lang) && field[lang as keyof typeof field]) {
    return field[lang as keyof typeof field];
  }
  return field[fallbackLang as keyof typeof field] || '';
};
const fallbackLanguage = 'en';

/**
 * Get all categories
 */
export async function getAllCategories(req: Request, res: Response): Promise<void> {
  try {
    const { isActive } = req.query;
    const lang = req.lang || fallbackLanguage;
    // Build filter object based on query parameters
    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    const categories = await Category.find(filter).sort({ displayOrder: 1 }).lean();
    const localizedCategories = categories.map(category => ({
      ...category,
      name: getLocalizedField(category.name as any, lang, fallbackLanguage),
      description: getLocalizedField(category.description as any, lang, fallbackLanguage),
    }));
    res.json(localizedCategories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
}

/**
 * Get a category by its ID
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const lang = req.lang || fallbackLanguage;
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    const localizedCategory = {
      ...category,
      name: getLocalizedField(category.name as any, lang, fallbackLanguage),
      description: getLocalizedField(category.description as any, lang, fallbackLanguage),
    };
    res.json(localizedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category' });
  }
}

/**
 * Create a new category
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, slug, image, isActive, displayOrder } = req.body;
    // Validate required multilingual fields
    if (!name || typeof name.en !== 'string' || typeof name.vi !== 'string' ||
        !description || typeof description.en !== 'string' || typeof description.vi !== 'string') {
      res.status(400).json({ message: 'Name (en, vi) và Description (en, vi) là bắt buộc và phải là string' });
      return;
    }
    const generatedSlug = slug || name.en.toLowerCase().replace(/\s+/g, '-');
    const existingCategory = await Category.findOne({ slug: generatedSlug });
    if (existingCategory) {
      res.status(400).json({ message: 'A category with this slug already exists' });
      return;
    }
    const category = new Category({
      name,
      description,
      slug: generatedSlug,
      image,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    });
    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
}

/**
 * Update a category
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, slug, image, isActive, displayOrder } = req.body;
    if (!name || typeof name.en !== 'string' || typeof name.vi !== 'string' ||
        !description || typeof description.en !== 'string' || typeof description.vi !== 'string') {
      res.status(400).json({ message: 'Name (en, vi) và Description (en, vi) là bắt buộc và phải là string' });
      return;
    }
    const newSlug = slug || name.en.toLowerCase().replace(/\s+/g, '-');
    const existingCategory = await Category.findOne({
      slug: newSlug,
      _id: { $ne: req.params.id }
    });
    if (existingCategory) {
      res.status(400).json({ message: 'A category with this slug already exists' });
      return;
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        slug: newSlug,
        image,
        isActive,
        displayOrder
      },
      { new: true, runValidators: true }
    );
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    if (error.name === 'MongoError' && error.code === 16759) {
      res.status(400).json({ message: 'Cannot delete category because it is being used by menu items' });
    } else {
      res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
  }
} 