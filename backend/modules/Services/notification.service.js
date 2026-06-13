const { Expo } = require('expo-server-sdk');

const expo = new Expo();

exports.sendNotification = async (pushToken, title, body) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error('Invalid Expo Push Token:', pushToken);
        return;
    }

    const messages = [
        {
            to: pushToken,
            sound: 'default',
            title,
            body,
        },
    ];

    try {
        const tickets = await expo.sendPushNotificationsAsync(messages);
        console.log('Notification ticket:', tickets);
        return tickets;
    } catch (error) {
        console.error('Notification Error:', error);
    }
};