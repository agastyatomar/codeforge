export async function initializePWA(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateAvailable();
            }
          });
        }
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  if ('onbeforeinstallprompt' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      hideInstallButton();
    });
  }
}

function showUpdateAvailable(): void {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-4';
  notification.innerHTML = `
    <span>New version available!</span>
    <button class="px-4 py-1 bg-primary-foreground text-primary rounded hover:bg-primary-foreground/90" onclick="window.location.reload()">
      Refresh
    </button>
    <button class="text-primary-foreground hover:underline" onclick="this.parentElement.remove()">
      Dismiss
    </button>
  `;
  document.body.appendChild(notification);
}

function showInstallButton(): void {
  const button = document.createElement('button');
  button.id = 'pwa-install-btn';
  button.className = 'fixed bottom-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
  button.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    Install App
  `;
  button.onclick = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      }
      (window as any).deferredPrompt = null;
      hideInstallButton();
    }
  };
  document.body.appendChild(button);
}

function hideInstallButton(): void {
  const button = document.getElementById('pwa-install-btn');
  if (button) button.remove();
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  return Notification.requestPermission();
}

export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options,
    });
  }
}

export function setupOfflineDetection(): void {
  const updateStatus = () => {
    const isOnline = navigator.onLine;
    const indicator = document.getElementById('offline-indicator');

    if (!isOnline) {
      if (!indicator) {
        const div = document.createElement('div');
        div.id = 'offline-indicator';
        div.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 z-50';
        div.textContent = 'You are offline. Changes will sync when reconnected.';
        document.body.prepend(div);
      }
    } else if (indicator) {
      indicator.remove();
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}