import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Plan } from '../models/Plan';
import { MenuItem } from '../models/MenuItem';
import dotenv from 'dotenv';
import { InferenceClient } from '@huggingface/inference';

dotenv.config();

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY || '');

const BASE_PROMPT = `You are an AI assistant for the vegan restaurant ChayFood.

ANSWERING PRINCIPLES:
1. ONLY answer based on the information in the menu and subscription plans provided below.
2. DO NOT arbitrarily add or fabricate information not present in the data.
3. If you do not have information about what the customer is asking, respond with: "Sorry, I do not have information on this matter."
4. When asked about prices, ALWAYS ensure to respond accurately according to the menu prices.
5. When recommending dishes, you MUST base it on the available descriptions and nutritional information.
6. Regarding subscription plans, ONLY introduce active plans and their actual features.

You can help customers with:
- Consulting about the menu and vegan dishes.
- Answering questions about vegan nutrition.
- Suggesting dishes suitable for their taste.
- Guiding them through ordering and payment.
- Explaining subscription plans.

Please answer:
- Friendly and polite.
- Concisely and to the point.
- ALWAYS based on the actual data provided.
- Acknowledge when you don't have information.

Respond in the language the user asked.`;

// Lấy lịch sử chat
export async function getChatHistory(req: Request, res: Response) {
  try {
    const chats = await Chat.find({ 
      userId: req.body.userId,
      isActive: true 
    })
    .sort({ lastMessageAt: -1 })
    .limit(10);

    return res.json(chats);
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
}

// Lấy chi tiết một chat
export async function getChatById(req: Request, res: Response) {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.body.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    return res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    return res.status(500).json({ error: 'Error fetching chat' });
  }
}

// Xử lý tin nhắn và phản hồi AI
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.body.userId || 'guest_' + Math.random().toString(36).substring(7);

    console.log('Fetching data from database...');

    // Fetch active plans from database
    const plans = await Plan.find({ isActive: true });
    console.log('Fetched plans:', plans.length ? plans : 'No plans found');
    
    // Fetch all menu items, selecting only necessary fields
    const menuItems = await MenuItem.find({ isAvailable: true })
      .select('name category price ingredients nutritionInfo');
    console.log('Fetched menu items:', menuItems.length ? menuItems : 'No menu items found');

    if (!plans.length || !menuItems.length) {
      console.log('Warning: Missing data from database');
      console.log('Plans:', plans);
      console.log('Menu Items:', menuItems);
    }

    // Build dynamic system prompt
    let systemPrompt = BASE_PROMPT + '\n\n';
    
    // Add menu items information
    systemPrompt += '=== MENU ===\n\n';
    
    // Group menu items by category
    const menuByCategory = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('Menu categories:', Object.keys(menuByCategory));

    // Log the final system prompt for debugging
    console.log('System Prompt Preview (first 500 chars):', systemPrompt.substring(0, 500));

    // Add menu items by category
    Object.entries(menuByCategory).forEach(([category, items]) => {
      systemPrompt += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        systemPrompt += `- ${item.name.vi || item.name.en} - ${item.price.toLocaleString()}đ\n`;
        if (item.ingredients && item.ingredients.length > 0) {
          systemPrompt += `  Ingredients: ${item.ingredients.join(', ')}\n`;
        }
        if (item.nutritionInfo) {
          systemPrompt += `  Nutrition: Calories: ${item.nutritionInfo.calories}, Protein: ${item.nutritionInfo.protein}, Carbs: ${item.nutritionInfo.carbs}, Fat: ${item.nutritionInfo.fat}\n`;
        }
      });
      systemPrompt += '\n';
    });

    // Add subscription plans information
    systemPrompt += '=== SUBSCRIPTION PLANS ===\n\n';
    plans.forEach((plan, index) => {
      systemPrompt += `${index + 1}. ${plan.name} - ${plan.price.toLocaleString()}đ/${plan.duration} days\n`;
      plan.features.forEach(feature => {
        systemPrompt += `- ${feature}\n`;
      });
      systemPrompt += '\n';
    });

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      chat = new Chat({
        userId,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date()
    });

    // Build messages for Hugging Face
    const hfMessages = chat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Call Hugging Face API
    const response = await hf.chatCompletion({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      messages: [
        { role: 'system', content: systemPrompt },
        ...hfMessages
      ],
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message?.content || 'Xin lỗi, tôi không thể xử lý yêu cầu này.';

    // Add assistant response
    chat.messages.push({
      role: 'assistant',
      content: assistantMessage,
      createdAt: new Date()
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    res.json({
      message: assistantMessage,
      chatId: chat._id
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Xóa chat (soft delete)
export async function deleteChat(req: Request, res: Response) {
  try {
    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        userId: req.body.userId
      },
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    return res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    return res.status(500).json({ error: 'Error deleting chat' });
  }
}
