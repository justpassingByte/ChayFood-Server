"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserGameHistory = exports.playGame = exports.canUserPlay = exports.getActiveMiniGames = exports.createMiniGame = void 0;
const MiniGame_1 = require("../models/MiniGame");
const UserGamePlay_1 = require("../models/UserGamePlay");
const notification_service_1 = require("./notification-service");
/**
 * Create a new mini-game
 */
const createMiniGame = async (gameData) => {
    try {
        // Validate total probability is 100%
        const totalProbability = gameData.rewards.reduce((sum, reward) => sum + reward.probability, 0);
        if (Math.abs(totalProbability - 100) > 0.01) {
            throw new Error('Total probability must equal 100%');
        }
        const game = new MiniGame_1.MiniGame(gameData);
        await game.save();
        return game;
    }
    catch (error) {
        console.error('Error creating mini-game:', error);
        throw error;
    }
};
exports.createMiniGame = createMiniGame;
/**
 * Get active mini-games
 */
const getActiveMiniGames = async () => {
    try {
        const now = new Date();
        return await MiniGame_1.MiniGame.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gt: now },
        });
    }
    catch (error) {
        console.error('Error getting active mini-games:', error);
        throw error;
    }
};
exports.getActiveMiniGames = getActiveMiniGames;
/**
 * Check if user can play a game
 */
const canUserPlay = async (userId, gameId) => {
    try {
        const game = await MiniGame_1.MiniGame.findById(gameId);
        if (!game) {
            return { canPlay: false, reason: 'Game not found' };
        }
        if (!game.isActive) {
            return { canPlay: false, reason: 'Game is not active' };
        }
        const now = new Date();
        if (now < game.startDate || now > game.endDate) {
            return { canPlay: false, reason: 'Game is not within its active period' };
        }
        // Check daily limit
        if (game.dailyPlayLimit > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const playsToday = await UserGamePlay_1.UserGamePlay.countDocuments({
                user: userId,
                game: gameId,
                playDate: { $gte: today },
            });
            if (playsToday >= game.dailyPlayLimit) {
                return { canPlay: false, reason: 'Daily play limit reached' };
            }
        }
        // Check total limit
        if (game.totalPlayLimit > 0) {
            const totalPlays = await UserGamePlay_1.UserGamePlay.countDocuments({
                user: userId,
                game: gameId,
            });
            if (totalPlays >= game.totalPlayLimit) {
                return { canPlay: false, reason: 'Total play limit reached' };
            }
        }
        return { canPlay: true };
    }
    catch (error) {
        console.error('Error checking if user can play:', error);
        throw error;
    }
};
exports.canUserPlay = canUserPlay;
/**
 * Play a game and get a reward
 */
const playGame = async (userId, gameId) => {
    try {
        // Check if user can play
        const { canPlay, reason } = await (0, exports.canUserPlay)(userId, gameId);
        if (!canPlay) {
            throw new Error(reason);
        }
        // Get the game
        const game = await MiniGame_1.MiniGame.findById(gameId);
        if (!game) {
            throw new Error('Game not found');
        }
        // Determine reward based on probabilities
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        let selectedReward = null;
        for (const reward of game.rewards) {
            cumulativeProbability += reward.probability;
            if (random <= cumulativeProbability) {
                // Check if reward limit is reached
                if (reward.limit > 0 && reward.awarded >= reward.limit) {
                    continue; // Skip this reward and try next one
                }
                selectedReward = reward;
                break;
            }
        }
        if (!selectedReward) {
            throw new Error('No available rewards');
        }
        // Create gameplay record
        const gameplay = new UserGamePlay_1.UserGamePlay({
            user: userId,
            game: gameId,
            reward: {
                type: selectedReward.type,
                value: selectedReward.value,
                code: selectedReward.code,
            },
        });
        await gameplay.save();
        // Update reward awarded count
        await MiniGame_1.MiniGame.updateOne({ _id: gameId, 'rewards._id': selectedReward._id }, { $inc: { 'rewards.$.awarded': 1 } });
        // Notify user about their reward
        await (0, notification_service_1.createNotification)(userId, 'You won a reward!', `Congratulations! You won ${selectedReward.value}${selectedReward.type === 'discount' ? '%' : ''} ${selectedReward.type}!`, 'system', {
            related: { type: 'game', id: gameId },
            channels: ['in_app'],
        });
        return gameplay;
    }
    catch (error) {
        console.error('Error playing game:', error);
        throw error;
    }
};
exports.playGame = playGame;
/**
 * Get user's game history
 */
const getUserGameHistory = async (userId, page = 1, limit = 20) => {
    try {
        const totalCount = await UserGamePlay_1.UserGamePlay.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalCount / limit);
        const plays = await UserGamePlay_1.UserGamePlay.find({ user: userId })
            .populate('game', 'name type')
            .sort({ playDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        return {
            plays,
            totalCount,
            currentPage: page,
            totalPages,
        };
    }
    catch (error) {
        console.error('Error getting user game history:', error);
        throw error;
    }
};
exports.getUserGameHistory = getUserGameHistory;
