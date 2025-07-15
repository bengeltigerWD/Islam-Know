// sw.js
let alarms = {};

self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_ALARM') {
        const { prayer, delay } = event.data;
        
        // Clear existing alarm if any
        if (alarms[prayer]) {
            clearTimeout(alarms[prayer]);
        }
        
        // Set new alarm
        alarms[prayer] = setTimeout(() => {
            // Trigger alarm
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'ALARM_TRIGGERED',
                        prayer: prayer
                    });
                });
            });
            
            // Show notification
            self.registration.showNotification(`${prayer} নামাজের সময়`, {
                body: 'আযান শুনুন এবং নামাজ আদায় করুন',
                icon: 'https://i.ibb.co/0jQ7ZqC/islamic-icon.png',
                requireInteraction: true
            });
            
            // Schedule for next day
            alarms[prayer] = setTimeout(() => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'ALARM_TRIGGERED',
                            prayer: prayer
                        });
                    });
                });
            }, 24 * 60 * 60 * 1000); // 24 hours later
            
        }, delay);
    }
    else if (event.data.type === 'CLEAR_ALARMS') {
        // Clear all alarms
        for (const prayer in alarms) {
            clearTimeout(alarms[prayer]);
        }
        alarms = {};
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({type: 'window'}).then( windowClients => {
            for (const client of windowClients) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});
