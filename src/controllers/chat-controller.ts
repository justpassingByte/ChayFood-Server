import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Plan } from '../models/Plan';
import { MenuItem } from '../models/MenuItem';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || ''
});

const BASE_PROMPT = `Bạn là một trợ lý AI của nhà hàng chay ChayFood.

NGUYÊN TẮC TRẢ LỜI:
1. CHỈ trả lời dựa trên thông tin có trong menu và subscription plans được cung cấp bên dưới
2. KHÔNG được tự ý thêm hoặc bịa ra thông tin không có trong dữ liệu
3. Nếu không có thông tin về điều khách hàng hỏi, hãy trả lời: "Xin lỗi, tôi không có thông tin về vấn đề này"
4. Khi khách hỏi về giá, LUÔN đảm bảo trả lời chính xác theo giá trong menu
5. Khi giới thiệu món ăn, PHẢI dựa vào mô tả và thông tin dinh dưỡng có sẵn
6. Về gói subscription, CHỈ giới thiệu những gói đang active và các tính năng thực có

Bạn có thể giúp khách hàng:
- Tư vấn về menu và các món ăn chay
- Giải đáp thắc mắc về dinh dưỡng chay
- Gợi ý các món phù hợp với khẩu vị
- Hướng dẫn đặt món và thanh toán
- Giải thích về các gói subscription

Hãy trả lời:
- Thân thiện và lịch sự
- Ngắn gọn, đi thẳng vào vấn đề
- LUÔN dựa trên dữ liệu thực tế được cung cấp
- Thừa nhận khi không biết thông tin`;

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
    
    // Fetch all menu items
    const menuItems = await MenuItem.find({ isAvailable: true });
    console.log('Fetched menu items:', menuItems.length ? menuItems : 'No menu items found');

    if (!plans.length || !menuItems.length) {
      console.log('Warning: Missing data from database');
      console.log('Plans:', plans);
      console.log('Menu Items:', menuItems);
    }

    // Build dynamic system prompt
    let systemPrompt = BASE_PROMPT + '\n\n';
    
    // Add menu items information
    systemPrompt += '=== THỰC ĐƠN ===\n\n';
    
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
      systemPrompt += `${category}:\n`;
      items.forEach(item => {
        systemPrompt += `- ${item.name} - ${item.price.toLocaleString()}đ\n`;
        if (item.description) {
          systemPrompt += `  ${item.description}\n`;
        }
        if (item.ingredients && item.ingredients.length > 0) {
          systemPrompt += `  Nguyên liệu: ${item.ingredients.join(', ')}\n`;
        }
        if (item.nutritionInfo) {
          systemPrompt += `  Dinh dưỡng: ${item.nutritionInfo}\n`;
        }
      });
      systemPrompt += '\n';
    });

    // Add subscription plans information
    systemPrompt += '=== GÓI SUBSCRIPTION ===\n\n';
    plans.forEach((plan, index) => {
      systemPrompt += `${index + 1}. ${plan.name} - ${plan.price.toLocaleString()}đ/${plan.duration} ngày\n`;
      if (plan.description) {
        systemPrompt += `${plan.description}\n`;
      }
      plan.features.forEach(feature => {
        systemPrompt += `- ${feature}\n`;
      });
      if (plan.hasDietitianSupport) systemPrompt += '- Có hỗ trợ chuyên gia dinh dưỡng\n';
      if (plan.hasCustomization) systemPrompt += '- Có thể tùy chỉnh thực đơn\n';
      if (plan.hasPriorityDelivery) systemPrompt += '- Giao hàng ưu tiên\n';
      if (plan.has24HrSupport) systemPrompt += '- Hỗ trợ 24/7\n';
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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        // Add previous messages as context
        ...chat.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        // Add current message
        {
          role: 'user',
          content: message
        }
      ]
    });

    // Get the first content block that is text
    const textBlock = response.content.find(block => 'type' in block && block.type === 'text');
    const assistantMessage = textBlock && 'text' in textBlock ? textBlock.text : 'Xin lỗi, tôi không thể xử lý yêu cầu này.';

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

