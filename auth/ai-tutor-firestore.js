/**
 * AI Tutor - Firestore Integration
 *
 * Handles storing and retrieving tutor conversations from Firestore.
 * All functions handle side effects (database operations).
 */

import { db } from './firebase-config.js';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

/**
 * Saves a tutor conversation to Firestore
 *
 * @param {string} userId - User ID (from Firebase Auth)
 * @param {string} conversationTitle - Title of the conversation
 * @param {array} messages - Array of message objects with role and content
 * @param {string} lessonTopic - The lesson topic discussed
 * @returns {Promise<string>} The conversation document ID
 * @throws {Error} If save fails
 */
export async function saveConversation(userId, conversationTitle, messages, lessonTopic) {
    if (!userId || !conversationTitle || !Array.isArray(messages)) {
        throw new Error('Invalid arguments for saveConversation');
    }

    if (messages.length < 2) {
        throw new Error('Conversation must have at least 2 messages');
    }

    try {
        const conversationRef = collection(db, 'tutorConversations');

        const docData = {
            userId,
            title: conversationTitle,
            topic: lessonTopic || 'General AI',
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || Date.now()
            })),
            messageCount: messages.length,
            userMessages: messages.filter(m => m.role === 'user').length,
            aiMessages: messages.filter(m => m.role === 'assistant').length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docSnap = await addDoc(conversationRef, docData);
        return docSnap.id;
    } catch (error) {
        console.error('Error saving conversation:', error);
        throw new Error(`Failed to save conversation: ${error.message}`);
    }
}

/**
 * Retrieves a specific conversation by ID
 *
 * @param {string} conversationId - The conversation document ID
 * @returns {Promise<object|null>} The conversation data or null if not found
 */
export async function getConversation(conversationId) {
    if (!conversationId) {
        throw new Error('Conversation ID is required');
    }

    try {
        const docRef = doc(db, 'tutorConversations', conversationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Error retrieving conversation:', error);
        throw new Error(`Failed to retrieve conversation: ${error.message}`);
    }
}

/**
 * Retrieves all conversations for a user
 *
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum number of conversations to retrieve
 * @returns {Promise<array>} Array of conversation summaries
 */
export async function getUserConversations(userId, maxResults = 20) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const conversationRef = collection(db, 'tutorConversations');
        const q = query(
            conversationRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(maxResults)
        );

        const querySnapshot = await getDocs(q);
        const conversations = [];

        querySnapshot.forEach(doc => {
            conversations.push({
                id: doc.id,
                title: doc.data().title,
                topic: doc.data().topic,
                messageCount: doc.data().messageCount,
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            });
        });

        return conversations;
    } catch (error) {
        console.error('Error retrieving user conversations:', error);
        throw new Error(`Failed to retrieve conversations: ${error.message}`);
    }
}

/**
 * Updates a conversation with new messages
 *
 * @param {string} conversationId - The conversation document ID
 * @param {array} messages - Updated message array
 * @returns {Promise<void>}
 */
export async function updateConversation(conversationId, messages) {
    if (!conversationId || !Array.isArray(messages)) {
        throw new Error('Invalid arguments for updateConversation');
    }

    try {
        const docRef = doc(db, 'tutorConversations', conversationId);

        const updateData = {
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || Date.now()
            })),
            messageCount: messages.length,
            userMessages: messages.filter(m => m.role === 'user').length,
            aiMessages: messages.filter(m => m.role === 'assistant').length,
            updatedAt: serverTimestamp()
        };

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Error updating conversation:', error);
        throw new Error(`Failed to update conversation: ${error.message}`);
    }
}

/**
 * Deletes a conversation
 *
 * @param {string} conversationId - The conversation document ID
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId) {
    if (!conversationId) {
        throw new Error('Conversation ID is required');
    }

    try {
        await deleteDoc(doc(db, 'tutorConversations', conversationId));
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw new Error(`Failed to delete conversation: ${error.message}`);
    }
}

/**
 * Retrieves conversations by topic
 *
 * @param {string} userId - User ID
 * @param {string} topic - Lesson topic to filter by
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<array>} Conversations matching the topic
 */
export async function getConversationsByTopic(userId, topic, maxResults = 10) {
    if (!userId || !topic) {
        throw new Error('User ID and topic are required');
    }

    try {
        const conversationRef = collection(db, 'tutorConversations');
        const q = query(
            conversationRef,
            where('userId', '==', userId),
            where('topic', '==', topic),
            orderBy('createdAt', 'desc'),
            limit(maxResults)
        );

        const querySnapshot = await getDocs(q);
        const conversations = [];

        querySnapshot.forEach(doc => {
            conversations.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return conversations;
    } catch (error) {
        console.error('Error retrieving conversations by topic:', error);
        throw new Error(`Failed to retrieve conversations by topic: ${error.message}`);
    }
}

/**
 * Gets statistics about a user's tutoring activity
 *
 * @param {string} userId - User ID
 * @returns {Promise<object>} Statistics object
 */
export async function getUserTutorStats(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const conversationRef = collection(db, 'tutorConversations');
        const q = query(
            conversationRef,
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        let totalConversations = 0;
        let totalMessages = 0;
        let totalTopics = new Set();
        let firstConversation = null;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            totalConversations++;
            totalMessages += data.messageCount || 0;
            if (data.topic) totalTopics.add(data.topic);
            if (!firstConversation || data.createdAt < firstConversation) {
                firstConversation = data.createdAt;
            }
        });

        return {
            totalConversations,
            totalMessages,
            uniqueTopics: totalTopics.size,
            avgMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0,
            firstConversationDate: firstConversation?.toDate?.() || null
        };
    } catch (error) {
        console.error('Error retrieving tutor stats:', error);
        throw new Error(`Failed to retrieve statistics: ${error.message}`);
    }
}

/**
 * Archives conversations older than a specified date
 * (Soft delete - marks as archived instead of removing)
 *
 * @param {string} userId - User ID
 * @param {Date} beforeDate - Archive conversations before this date
 * @returns {Promise<number>} Number of conversations archived
 */
export async function archiveOldConversations(userId, beforeDate) {
    if (!userId || !beforeDate) {
        throw new Error('User ID and date are required');
    }

    try {
        const conversationRef = collection(db, 'tutorConversations');
        const q = query(
            conversationRef,
            where('userId', '==', userId),
            where('createdAt', '<', Timestamp.fromDate(beforeDate))
        );

        const querySnapshot = await getDocs(q);
        let archivedCount = 0;

        for (const docSnap of querySnapshot.docs) {
            await updateDoc(doc(db, 'tutorConversations', docSnap.id), {
                archived: true,
                archivedAt: serverTimestamp()
            });
            archivedCount++;
        }

        return archivedCount;
    } catch (error) {
        console.error('Error archiving conversations:', error);
        throw new Error(`Failed to archive conversations: ${error.message}`);
    }
}

/**
 * Exports user conversations as JSON
 * Useful for student portfolios and data export
 *
 * @param {string} userId - User ID
 * @returns {Promise<object>} Export object with all conversations
 */
export async function exportUserConversations(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const conversations = await getUserConversations(userId, 100);
        const stats = await getUserTutorStats(userId);

        return {
            exported: new Date().toISOString(),
            userId,
            statistics: stats,
            conversations: conversations,
            totalSize: conversations.length
        };
    } catch (error) {
        console.error('Error exporting conversations:', error);
        throw new Error(`Failed to export conversations: ${error.message}`);
    }
}
