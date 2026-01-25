// Registro del Service Worker
export function registerServiceWorker() {
  // Avoid service worker during development: it can cache Next dev chunks and cause blank pages / hydration errors.
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);

          // Manejar actualizaciones del service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  console.log('New service worker available');
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });

    // Manejar mensajes del service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload();
      }
    });
  }
}

// Mostrar notificación de actualización
function showUpdateNotification() {
  // Crear notificación personalizada
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg';
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <div>
        <p class="font-medium">Nueva versión disponible</p>
        <p class="text-sm opacity-90">Recarga la página para actualizar</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove(); window.location.reload();" 
              class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">
        Actualizar
      </button>
      <button onclick="this.parentElement.parentElement.remove();" 
              class="text-white opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remover automáticamente después de 10 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

// Función para forzar actualización del service worker
export function updateServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// Función para verificar estado del service worker
export function checkServiceWorkerStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      resolve(!!registration.active);
    }).catch(() => {
      resolve(false);
    });
  });
}
