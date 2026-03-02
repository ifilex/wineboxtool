// Script de instalación para la PWA

// Registrar el service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('Nueva versión del Service Worker encontrada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión instalada, preguntar al usuario si quiere actualizar
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });

  // Escuchar mensajes del service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'SYNC_COMPLETED') {
      console.log('Sincronización completada en segundo plano:', event.data.timestamp);
      showNotification('Datos sincronizados correctamente', 'success');
    }
  });
}

// Mostrar notificación de actualización disponible
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <i class="fas fa-sync-alt"></i>
      <span>Nueva versión disponible</span>
      <button onclick="updateApp()" class="btn btn-small btn-primary">Actualizar</button>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-small btn-danger">×</button>
    </div>
  `;
  document.body.appendChild(notification);
}

// Función global para actualizar la app
window.updateApp = function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        // Enviar mensaje al service worker para que tome control
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
  
  // Recargar la página después de un momento
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

// Detectar si la app se puede instalar
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que Chrome muestre el mini-infobar automáticamente
  e.preventDefault();
  // Guardar el evento para usarlo después
  deferredPrompt = e;
  
  // Mostrar botón de instalación personalizado
  showInstallButton();
});

function showInstallButton() {
  // Verificar si ya existe el botón
  if (document.getElementById('install-button')) return;
  
  const installButton = document.createElement('div');
  installButton.id = 'install-button';
  installButton.className = 'install-prompt';
  installButton.innerHTML = `
    <div class="install-content">
      <i class="fas fa-download"></i>
      <span>Instalar aplicación</span>
      <button onclick="installApp()" class="btn btn-small btn-success">Instalar</button>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-small btn-danger">×</button>
    </div>
  `;
  document.body.appendChild(installButton);
}

// Función global para instalar la app
window.installApp = function() {
  if (!deferredPrompt) return;
  
  // Mostrar el prompt de instalación
  deferredPrompt.prompt();
  
  // Esperar a que el usuario responda al prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Usuario aceptó la instalación');
    } else {
      console.log('Usuario rechazó la instalación');
    }
    
    // Limpiar el evento guardado
    deferredPrompt = null;
    
    // Ocultar el botón de instalación
    const installButton = document.getElementById('install-button');
    if (installButton) installButton.remove();
  });
};

// Detectar cuando la app está instalada y en modo standalone
window.addEventListener('appinstalled', (evt) => {
  console.log('App instalada correctamente');
  
  // Ocultar cualquier botón de instalación
  const installButton = document.getElementById('install-button');
  if (installButton) installButton.remove();
  
  // Mostrar mensaje de bienvenida
  showNotification('¡App instalada correctamente!', 'success');
});

// Verificar si la app se está ejecutando en modo standalone
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
  console.log('App ejecutándose en modo standalone');
  document.body.classList.add('app-installed');
}

// Función para guardar datos offline
window.saveOffline = function(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  
  // Intentar sincronizar si hay conexión
  if (navigator.onLine) {
    syncOfflineData();
  } else {
    showNotification('Datos guardados localmente. Se sincronizarán cuando haya conexión.', 'info');
  }
};

// Función para sincronizar datos offline
async function syncOfflineData() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
      console.log('Sincronización en segundo plano registrada');
    } catch (error) {
      console.error('Error al registrar sincronización:', error);
    }
  }
}

// Detectar cambios en la conexión
window.addEventListener('online', () => {
  console.log('Conexión restaurada');
  showNotification('Conexión restaurada. Sincronizando datos...', 'success');
  syncOfflineData();
});

window.addEventListener('offline', () => {
  console.log('Sin conexión');
  showNotification('Modo offline activado. Los datos se guardarán localmente.', 'warning');
});

// Función mejorada para notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div>
      ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'} 
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
    </div>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; font-size: 1.2rem;">×</button>
  `;
  
  const notificationArea = document.getElementById('notificationArea');
  if (notificationArea) {
    notificationArea.appendChild(notification);
  } else {
    // Si no existe el área de notificaciones, crearla
    const area = document.createElement('div');
    area.id = 'notificationArea';
    document.body.appendChild(area);
    area.appendChild(notification);
  }
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 4000);
}