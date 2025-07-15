// Service Worker for Prayer Alarm
let alarms = {};

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_ALARM') {
        const { prayer, time } = event.data;
        
        // Clear existing alarm if any
        if (alarms[prayer]) {
            clearTimeout(alarms[prayer]);
        }
        
        // Calculate time until alarm
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const alarmTime = new Date();
        
        alarmTime.setHours(hours);
        alarmTime.setMinutes(minutes);
        alarmTime.setSeconds(0);
        
        // If time has already passed today, set for tomorrow
        if (alarmTime <= now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }
        
        const delay = alarmTime.getTime() - now.getTime();
        
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
            const prayerNames = {
                fajr: "ফজর",
                zuhr: "জোহর",
                asr: "আসর",
                maghrib: "মাগরিব",
                isha: "ইশা"
            };
            
            self.registration.showNotification(`${prayerNames[prayer]} নামাজের সময়`, {
                body: 'আযান শুনুন এবং নামাজ আদায় করুন',
                icon: 'islamic-icon.png',
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200, 100, 400]
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
        self.clients.matchAll({type: 'window'}).then(windowClients => {
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
