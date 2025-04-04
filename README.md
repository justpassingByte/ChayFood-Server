# ChayFood Backend API

A robust Node.js backend for the ChayFood vegan food delivery platform built with Express, TypeScript, MongoDB, and OAuth2 authentication.

## Features

- 🔐 OAuth2 Authentication with Google
- 👤 User Management
- 🍽️ Menu Management
- 📦 Order Processing
- 🔒 Role-based Access Control
- 📝 TypeScript Support
- 🗄️ MongoDB Integration
- 🏗️ MVC Architecture Pattern
- 🥗 Nutritional Information Tracking (Calories & Protein)
- 🔍 Advanced Search Engine for Menu Items
- 🗓️ Subscription-based Meal Plans
- 📊 Flexible Plan Management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- Google OAuth2 credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Quancon/ChayFood.git
cd chayfood-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chayfood
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3000
```

4. Build the project:
```bash
npm run build
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

The project follows the MVC (Model-View-Controller) architecture pattern:

```
src/
├── config/       # Configuration files
├── controllers/  # Business logic for each route
├── middleware/   # Custom middleware
├── models/       # MongoDB schemas and models
├── routes/       # API route definitions
├── utils/        # Utility functions
└── index.ts      # Application entry point
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth2 login
- `GET /auth/google/callback` - Handle OAuth2 callback
- `GET /auth/status` - Check authentication status
- `GET /auth/logout` - Logout user

### Menu
- `GET /menu` - Get all menu items
  - Query params: 
    - `category` (optional): Filter by food category
    - `minCalories`, `maxCalories` (optional): Filter by calorie range
    - `minProtein`, `maxProtein` (optional): Filter by protein content range
- `GET /menu/search` - Search menu items by text
  - Query params:
    - `query` (required): Search term to match against name, description, and ingredients
    - `category` (optional): Filter by food category
    - `minCalories`, `maxCalories` (optional): Filter by calorie range
    - `minProtein`, `maxProtein` (optional): Filter by protein content range
    - `sort` (optional): Sort field - 'name', 'price', 'calories', 'protein' (default: 'name')
    - `order` (optional): Sort order - 'asc' or 'desc' (default: 'asc')
    - `limit` (optional): Number of results per page (default: 20)
    - `page` (optional): Page number for pagination (default: 1)
- `GET /menu/nutrition` - Get menu items filtered by nutritional content
  - Query params: `minCalories`, `maxCalories`, `minProtein`, `maxProtein`
- `GET /menu/:id` - Get specific menu item
- `POST /menu` - Create menu item (admin only)
- `PUT /menu/:id` - Update menu item (admin only)
- `DELETE /menu/:id` - Delete menu item (admin only)

### Orders
- `GET /order` - Get all orders (admin) or user's orders (legacy route)
- `GET /order/admin/all` - Get all orders (admin only)
- `GET /order/user/my-orders` - Get user's own orders (requires authentication)
- `GET /order/:id` - Get specific order
- `POST /order` - Create new order
- `PATCH /order/:id/status` - Update order status (admin only)
- `PATCH /order/:id/cancel` - Cancel order (only pending orders)
- `PATCH /order/:id/user/confirm-delivery` - Mark an order as delivered/received (user only)

### Plans
- `GET /plan` - Get all subscription plans
- `GET /plan/:id` - Get specific subscription plan
- `POST /plan` - Create new subscription plan (admin only)
- `PUT /plan/:id` - Update subscription plan (admin only)
- `DELETE /plan/:id` - Delete subscription plan (admin only)

### Subscriptions
- `GET /subscription/plans` - Get available subscription plans
- `POST /subscription` - Create a new subscription (authenticated)
- `GET /subscription/my-subscriptions` - Get user's subscriptions (authenticated)
- `GET /subscription/:id` - Get a specific subscription (authenticated)
- `PATCH /subscription/:id/menu` - Update subscription menu selections (authenticated)
- `PATCH /subscription/:id/cancel` - Cancel a subscription (authenticated)

## Testing the API

### Generating Test Tokens

The API includes utility scripts to generate test tokens for API testing:

1. For regular user access:
```bash
npx ts-node src/utils/generate-test-token.ts
```

2. For admin access (required for create/update/delete operations):
```bash
npx ts-node src/utils/generate-admin-token.ts
```

> **Important Note about Authentication**: Always use a freshly generated token. The token contains the user ID and role information required for authentication. Without a valid token, you will receive "Authentication required" errors.

### Testing with Postman

1. **Setup Postman Environment**:
   - Create a new environment with variables:
     - `base_url`: http://localhost:5000
     - `token`: (paste your generated token here)

2. **Authentication**:
   - For protected endpoints, add the Authorization header:
     - Key: `Authorization`
     - Value: `Bearer {{token}}`
   - In Postman, you can also use the Auth tab:
     - Type: Bearer Token
     - Token: Paste your token (without the "Bearer " prefix)

3. **Content Type**:
   - For POST and PUT requests, set the Content-Type header:
     - Key: `Content-Type`
     - Value: `application/json`
   - Make sure to select "raw" and "JSON" in the body tab

### Troubleshooting Common Errors

1. **"Authentication required" errors**:
   - Generate a new token using the scripts above
   - Make sure your Authorization header is correctly formatted
   - Check that the token hasn't expired

2. **"Error creating order" or "Error fetching orders" (400 errors)**:
   - Check that your request body matches the required format
   - Ensure all required fields are included
   - Verify Content-Type header is set to `application/json`
   - Make sure menu item IDs exist in the database

3. **500 Server Errors**:
   - Check the server console for detailed error logs
   - These typically indicate database connection issues or schema validation errors
   - Verify that MongoDB is running and accessible

### Creating Orders

When creating a new order, follow these steps:

1. **Get Menu Item IDs**:
   - First retrieve menu items by making a GET request to `/menu`
   - Take note of the `_id` values of the items you want to order

2. **Create Order** (POST `/order`):
   - URL: `{{base_url}}/order`
   - Headers:
     - `Authorization: Bearer {{token}}`
     - `Content-Type: application/json`
   - Required Fields:
     - `items`: Array of ordered items (must include menuItem, quantity, price)
     - `totalAmount`: Total price of the order
     - `deliveryAddress`: Object with street, city, state, and postalCode
     - `paymentMethod`: One of 'cod', 'card', or 'banking'

3. **Example Order Request Body**:
```json
{
  "items": [
    {
      "menuItem": "645a1b2c3d4e5f6a7b8c9d0e",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "totalAmount": 25.98,
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Anytown",
    "state": "ST",
    "postalCode": "12345"
  },
  "paymentMethod": "card",
  "specialInstructions": "Please ring doorbell twice"
}
```

4. **Common Order Creation Errors**:
   - Missing required fields (items, totalAmount, deliveryAddress, paymentMethod)
   - Invalid menu item IDs
   - Invalid payment method (must be 'cod', 'card', or 'banking')
   - Missing authentication token
   - Invalid item quantities or prices

### Fetching Orders

1. **Get All Orders** (admin only):
   - Endpoint: `GET /order/admin/all`
   - Required header:
     - `Authorization: Bearer {{token}}` (admin token required)
   - Returns all orders in the system
   - Only accessible to users with admin role

2. **Get User's Own Orders**:
   - Endpoint: `GET /order/user/my-orders`
   - Required header:
     - `Authorization: Bearer {{token}}`
   - Returns only orders created by the authenticated user

3. **Legacy Get Orders** (dual purpose):
   - Endpoint: `GET /order`
   - Required header:
     - `Authorization: Bearer {{token}}`
   - For admin users: Returns all orders in the system
   - For regular users: Returns only the user's own orders
   - Included for backward compatibility

4. **Get Order by ID**:
   - Endpoint: `GET /order/:id`
   - Required header:
     - `Authorization: Bearer {{token}}`
   - Users can only access their own orders
   - Admins can access any order

### Mock Data for Testing

#### Menu Items

1. **Create Menu Item** (POST `/menu`):
```json
{
  "name": "Vegan Pad Thai",
  "description": "Classic Thai noodles with tofu and vegetables",
  "price": 12.99,
  "category": "main",
  "image": "https://placekitten.com/500/300",
  "nutritionInfo": {
    "calories": 450,
    "protein": 15,
    "carbs": 65,
    "fat": 12
  },
  "preparationTime": 15,
  "ingredients": ["rice noodles", "tofu", "bean sprouts", "peanuts", "lime"],
  "allergens": ["peanuts", "soy"]
}
```

2. **Create Dessert Item** (POST `/menu`):
```json
{
  "name": "Coconut Chia Pudding",
  "description": "Creamy coconut pudding with chia seeds and fresh berries",
  "price": 6.99,
  "category": "dessert",
  "image": "https://placekitten.com/500/301",
  "nutritionInfo": {
    "calories": 320,
    "protein": 8,
    "carbs": 40,
    "fat": 18
  },
  "preparationTime": 10,
  "ingredients": ["chia seeds", "coconut milk", "maple syrup", "mixed berries"],
  "allergens": ["tree nuts"]
}
```

3. **Create Beverage Item** (POST `/menu`):
```json
{
  "name": "Green Detox Smoothie",
  "description": "Refreshing smoothie with kale, spinach, apple and ginger",
  "price": 5.99,
  "category": "beverage",
  "image": "https://placekitten.com/500/302",
  "nutritionInfo": {
    "calories": 180,
    "protein": 4,
    "carbs": 35,
    "fat": 2
  },
  "preparationTime": 5,
  "ingredients": ["kale", "spinach", "apple", "ginger", "lemon", "coconut water"],
  "allergens": []
}
```

#### Orders

1. **Create Order** (POST `/order`):
```json
{
  "items": [
    {
      "menuItem": "MENU_ITEM_ID_HERE",
      "quantity": 2,
      "price": 12.99,
      "specialInstructions": "Extra spicy please"
    },
    {
      "menuItem": "ANOTHER_MENU_ITEM_ID_HERE",
      "quantity": 1,
      "price": 5.99
    }
  ],
  "totalAmount": 31.97,
  "deliveryAddress": {
    "street": "123 Vegan Street",
    "city": "Plantville",
    "state": "Greenstate",
    "postalCode": "12345",
    "additionalInfo": "Apartment 4B"
  },
  "paymentMethod": "card",
  "specialInstructions": "Please ring the doorbell twice"
}
```

2. **Update Order Status** (PATCH `/order/:id/status`):
```json
{
  "status": "confirmed"
}
```

## Controllers

The controllers handle the business logic for each endpoint:

### AuthController
- `handleGoogleCallback`: Process OAuth callback and generate JWT token
- `checkAuthStatus`: Check if user is authenticated
- `logout`: Log out the current user

### MenuController
- `getAllMenuItems`: Get all menu items with optional filtering
- `searchMenuItems`: Search menu items by text with filtering, sorting and pagination
- `getNutritionalMenuItems`: Filter menu items by nutritional values
- `getMenuItemById`: Get a specific menu item
- `createMenuItem`: Create a new menu item (admin only)
- `updateMenuItem`: Update an existing menu item (admin only)
- `deleteMenuItem`: Delete a menu item (admin only)

### OrderController
- `getOrders`: Get all orders (admin) or user's orders
- `getOrderById`: Get a specific order
- `createOrder`: Create a new order
- `updateOrderStatus`: Update order status (admin only)
- `cancelOrder`: Cancel an order (if it's pending)

## Data Models

### MenuItem
```typescript
{
  name: string;
  description: string;
  price: number;
  category: 'main' | 'side' | 'dessert' | 'beverage';
  image: string;
  nutritionInfo: {
    calories: number;  // Total calories per serving
    protein: number;   // Protein content in grams
    carbs: number;     // Carbohydrate content in grams
    fat: number;       // Fat content in grams
  };
  isAvailable: boolean;
  preparationTime: number; // in minutes
  ingredients: string[];
  allergens?: string[];
}
```

### Order
```typescript
{
  user: ObjectId;
  items: Array<{
    menuItem: ObjectId;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    additionalInfo?: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'cod' | 'card' | 'banking';
  deliveryTime?: Date;
  specialInstructions?: string;
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token_here>
```

## Subscription-based Meal Plans

To cancel an order:
```
PATCH /order/:id/cancel
```

No request body is required. Authentication token must be provided. 

### Confirming Order Delivery

Users can mark their orders as delivered with these restrictions:
- Only orders in "confirmed", "ready", or "out_for_delivery" status can be marked as delivered
- Orders in "pending", "preparing", "delivered" or "cancelled" status cannot be marked as delivered
- Users can only confirm delivery for their own orders
- Admins can mark any eligible order as delivered

To confirm order delivery:
```
PATCH /order/:id/user/confirm-delivery
```

No request body is required. Authentication token must be provided.

## Subscription-based Meal Plans

ChayFood offers flexible subscription-based meal plans that can be fully customized.