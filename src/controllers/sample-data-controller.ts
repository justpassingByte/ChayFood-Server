import { Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';
import { User } from '../models/User';
import { Order } from '../models/Order';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Helper functions
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomChoiceWeighted = <T>(choices: Record<string, number>): string => {
  const entries = Object.entries(choices);
  const weights = entries.map(([_, weight]) => weight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let randomNum = Math.random() * totalWeight;
  
  for (const [choice, weight] of entries) {
    if (randomNum < weight) {
      return choice;
    }
    randomNum -= weight;
  }
  
  return entries[entries.length - 1][0]; // fallback to last choice
};

// Sample data for menu items
const sampleMenuItems = [
  {
    name: 'Vegan Pho',
    description: 'Traditional Vietnamese soup with rice noodles, tofu, and vegetables',
    price: 98000,
    category: 'main',
    image: '/menu/vegan-pho.jpg',
    isAvailable: true,
    nutritionInfo: {
      calories: 320,
      protein: 12,
      carbs: 45,
      fat: 6
    },
    preparationTime: 15,
    ingredients: ['Rice Noodles', 'Tofu', 'Bean Sprouts', 'Mushrooms', 'Herbs'],
    allergens: ['Gluten', 'Soy']
  },
  {
    name: 'Tofu Rice Bowl',
    description: 'Crispy tofu with steamed rice, fresh vegetables and spicy sauce',
    price: 85000,
    category: 'main',
    image: '/menu/tofu-rice.jpg',
    isAvailable: true,
    nutritionInfo: {
      calories: 420,
      protein: 18,
      carbs: 60,
      fat: 10
    },
    preparationTime: 12,
    ingredients: ['Rice', 'Tofu', 'Vegetables', 'Spicy Sauce'],
    allergens: ['Soy']
  },
  {
    name: 'Mushroom Spring Rolls',
    description: 'Fresh spring rolls filled with mushrooms, carrots, cucumber and herbs',
    price: 65000,
    category: 'side',
    image: '/menu/spring-rolls.jpg',
    isAvailable: true,
    nutritionInfo: {
      calories: 220,
      protein: 6,
      carbs: 28,
      fat: 8
    },
    preparationTime: 10,
    ingredients: ['Rice Paper', 'Mushrooms', 'Carrots', 'Cucumber', 'Herbs'],
    allergens: []
  },
  {
    name: 'Coconut Smoothie',
    description: 'Refreshing coconut smoothie with a hint of vanilla',
    price: 45000,
    category: 'beverage',
    image: '/menu/coconut-smoothie.jpg',
    isAvailable: true,
    nutritionInfo: {
      calories: 180,
      protein: 3,
      carbs: 22,
      fat: 8
    },
    preparationTime: 5,
    ingredients: ['Coconut Milk', 'Ice', 'Vanilla Extract', 'Sugar'],
    allergens: []
  },
  {
    name: 'Mango Sticky Rice',
    description: 'Sweet sticky rice with fresh mango and coconut cream',
    price: 55000,
    category: 'dessert',
    image: '/menu/mango-sticky-rice.jpg',
    isAvailable: true,
    nutritionInfo: {
      calories: 320,
      protein: 4,
      carbs: 65,
      fat: 6
    },
    preparationTime: 8,
    ingredients: ['Sticky Rice', 'Mango', 'Coconut Cream', 'Sugar'],
    allergens: []
  }
];

// Sample Vietnamese names
const vietnameseFirstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Vu', 'Bui', 'Do', 'Dang', 'Dinh'];
const vietnameseLastNames = ['Van', 'Thi', 'Minh', 'Thanh', 'Duc', 'Quang', 'Tuan', 'Hai', 'Hoa', 'Lan', 'Huong'];
const vietnameseNames = ['An', 'Binh', 'Cuong', 'Dung', 'Hang', 'Hien', 'Hoa', 'Huong', 'Khanh', 'Lan', 'Linh', 'Mai', 'Nam', 'Ngoc', 'Phuong', 'Quang', 'Tam', 'Thanh', 'Trang', 'Tuan', 'Yen'];

// Sample Vietnamese cities and states
const vietnameseRegions = [
  { city: 'Hanoi', state: 'Hà Nội', region: 'North' },
  { city: 'Hai Phong', state: 'Hải Phòng', region: 'North' },
  { city: 'Da Nang', state: 'Đà Nẵng', region: 'Central' },
  { city: 'Hue', state: 'Thừa Thiên Huế', region: 'Central' },
  { city: 'Ho Chi Minh City', state: 'Hồ Chí Minh', region: 'South' },
  { city: 'Can Tho', state: 'Cần Thơ', region: 'South' }
];

// Order statuses
const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

// Payment methods
const paymentMethods = ['cash', 'card', 'banking', 'momo', 'zaloPay'];

/**
 * Generate sample menu items
 */
export const generateMenuItems = async (req: Request, res: Response) => {
  try {
    const { count = 10 } = req.body;
    
    if (count > 100) {
      return res.status(400).json({
        message: 'Cannot generate more than 100 menu items at once'
      });
    }
    
    // Generate variations of sample menu items
    const menuItems = [];
    const categories = ['main', 'side', 'dessert', 'beverage'];
    
    for (let i = 0; i < count; i++) {
      const templateItem = randomChoice(sampleMenuItems);
      const category = randomChoice(categories);
      const price = randomBetween(30000, 150000);
      
      // Create variation of the item
      const menuItem = {
        name: `${templateItem.name} ${i + 1}`,
        description: templateItem.description,
        price,
        category,
        image: templateItem.image,
        isAvailable: Math.random() > 0.1, // 90% are available
        nutritionInfo: {
          calories: randomBetween(100, 600),
          protein: randomBetween(2, 25),
          carbs: randomBetween(10, 80),
          fat: randomBetween(2, 20)
        },
        preparationTime: randomBetween(5, 30),
        ingredients: templateItem.ingredients,
        allergens: templateItem.allergens
      };
      
      menuItems.push(menuItem);
    }
    
    // Insert into database
    await MenuItem.insertMany(menuItems);
    
    return res.status(201).json({
      message: `Successfully generated ${count} menu items`,
      count
    });
    
  } catch (error) {
    console.error('Error generating menu items:', error);
    return res.status(500).json({
      message: 'Failed to generate menu items'
    });
  }
};

/**
 * Generate sample users
 */
export const generateUsers = async (req: Request, res: Response) => {
  try {
    const { count = 20 } = req.body;
    
    if (count > 100) {
      return res.status(400).json({
        message: 'Cannot generate more than 100 users at once'
      });
    }
    
    // Generate random users
    const users = [];
    const passwordHash = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < count; i++) {
      const firstName = randomChoice(vietnameseFirstNames);
      const middleName = randomChoice(vietnameseLastNames);
      const lastName = randomChoice(vietnameseNames);
      const fullName = `${firstName} ${middleName} ${lastName}`;
      const email = `user${i + 1}@example.com`;
      
      // Random address
      const region = randomChoice(vietnameseRegions);
      const address = {
        street: `${randomBetween(1, 100)} ${lastName} Street`,
        city: region.city,
        state: region.state,
        postalCode: `${randomBetween(10000, 99999)}`,
        isDefault: true
      };
      
      // Create user object
      const user = {
        name: fullName,
        email,
        password: passwordHash,
        phone: `+84${randomBetween(100000000, 999999999)}`,
        addresses: [address],
        preferences: {
          dietaryRestrictions: Math.random() > 0.7 ? ['vegetarian'] : [],
          favoriteCategories: [randomChoice(categories)]
        },
        createdAt: randomDate(new Date('2022-01-01'), new Date())
      };
      
      users.push(user);
    }
    
    // Insert into database
    await User.insertMany(users);
    
    return res.status(201).json({
      message: `Successfully generated ${count} users`,
      count
    });
    
  } catch (error) {
    console.error('Error generating users:', error);
    return res.status(500).json({
      message: 'Failed to generate users'
    });
  }
};

/**
 * Generate sample orders
 */
export const generateOrders = async (req: Request, res: Response) => {
  try {
    const { 
      count = 50,
      timeRange = {
        startDate: '2023-01-01',
        endDate: new Date().toISOString().split('T')[0]
      },
      distribution = {
        regions: { North: 0.4, Central: 0.3, South: 0.3 },
        categories: { main: 0.5, side: 0.2, dessert: 0.2, beverage: 0.1 },
        statuses: { 
          delivered: 0.6, 
          cancelled: 0.1, 
          pending: 0.1, 
          confirmed: 0.1, 
          preparing: 0.1 
        }
      }
    } = req.body;
    
    if (count > 500) {
      return res.status(400).json({
        message: 'Cannot generate more than 500 orders at once'
      });
    }
    
    // Get all users and menu items
    const users = await User.find({}).select('_id addresses');
    const menuItems = await MenuItem.find({}).select('_id price category');
    
    if (users.length === 0 || menuItems.length === 0) {
      return res.status(400).json({
        message: 'No users or menu items found. Please generate them first.'
      });
    }
    
    // Prepare date range
    const startDate = new Date(timeRange.startDate);
    const endDate = new Date(timeRange.endDate);
    
    // Generate orders
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      // Select random user and their address
      const user = randomChoice(users);
      const userAddress = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
      
      // Determine region based on weighted distribution
      const regionType = randomChoiceWeighted(distribution.regions);
      
      // Filter users by region
      const regionUsers = users.filter(u => {
        const address = u.addresses.find((a: any) => a.isDefault) || u.addresses[0];
        const region = vietnameseRegions.find(r => r.state === address.state);
        return region && region.region === regionType;
      });
      
      // If we have users in this region, select one
      const regionUser = regionUsers.length > 0 ? randomChoice(regionUsers) : user;
      const regionUserAddress = regionUser.addresses.find((a: any) => a.isDefault) || regionUser.addresses[0];
      
      // Get menu items based on category weights
      const orderItems = [];
      const itemCount = randomBetween(1, 5);
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const categoryType = randomChoiceWeighted(distribution.categories);
        
        // Filter menu items by category
        const categoryItems = menuItems.filter((item: any) => item.category === categoryType);
        
        // If we have items in this category, select one
        if (categoryItems.length > 0) {
          const menuItem = randomChoice(categoryItems);
          const quantity = randomBetween(1, 3);
          const price = menuItem.price;
          
          orderItems.push({
            menuItem: menuItem._id,
            quantity,
            price
          });
          
          totalAmount += price * quantity;
        }
      }
      
      // Skip if no items
      if (orderItems.length === 0) continue;
      
      // Determine status based on weighted distribution
      const status = randomChoiceWeighted(distribution.statuses);
      
      // Create order
      const order = {
        user: regionUser._id,
        items: orderItems,
        totalAmount,
        deliveryAddress: {
          street: regionUserAddress.street,
          city: regionUserAddress.city,
          state: regionUserAddress.state,
          postalCode: regionUserAddress.postalCode
        },
        status,
        paymentMethod: randomChoice(paymentMethods),
        createdAt: randomDate(startDate, endDate)
      };
      
      orders.push(order);
    }
    
    // Insert into database
    if (orders.length > 0) {
      await Order.insertMany(orders);
    }
    
    return res.status(201).json({
      message: `Successfully generated ${orders.length} orders`,
      count: orders.length
    });
    
  } catch (error) {
    console.error('Error generating orders:', error);
    return res.status(500).json({
      message: 'Failed to generate orders'
    });
  }
};

/**
 * Generate complete dataset
 */
export const generateAll = async (req: Request, res: Response) => {
  try {
    const { 
      menuItems = 20,
      users = 50,
      orders = 200,
      timeRange = {
        startDate: '2022-01-01',
        endDate: new Date().toISOString().split('T')[0]
      }
    } = req.body;
    
    // Sequential data generation
    
    // 1. Generate menu items
    await MenuItem.deleteMany({});
    const menuReq = { body: { count: menuItems } } as Request;
    await generateMenuItems(menuReq, res);
    
    // 2. Generate users
    await User.deleteMany({});
    const userReq = { body: { count: users } } as Request;
    await generateUsers(userReq, res);
    
    // 3. Generate orders
    await Order.deleteMany({});
    const orderReq = { 
      body: { 
        count: orders,
        timeRange
      } 
    } as Request;
    await generateOrders(orderReq, res);
    
    return res.status(201).json({
      message: 'Successfully generated complete dataset',
      stats: {
        menuItems,
        users,
        orders
      }
    });
    
  } catch (error) {
    console.error('Error generating complete dataset:', error);
    return res.status(500).json({
      message: 'Failed to generate complete dataset'
    });
  }
};

/**
 * Clear all sample data
 */
export const clearSampleData = async (req: Request, res: Response) => {
  try {
    const { confirm } = req.query;
    
    if (confirm !== 'true') {
      return res.status(400).json({
        message: 'Please confirm deletion by setting confirm=true'
      });
    }
    
    // Delete all data
    await MenuItem.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    
    return res.status(200).json({
      message: 'Successfully cleared all sample data'
    });
    
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return res.status(500).json({
      message: 'Failed to clear sample data'
    });
  }
}; 