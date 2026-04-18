/**
 * Sistema de integración con IA de Maudes Arquitectura
 * Archivo centralizado para gestionar los botones de chat con IA
 */
(function () {
  'use strict';

  var FRONTEND_BASE_URL = 'https://iarquitect.maudesarquitectura.es';
  var TENANT_ID = '46df1d61-7ffe-4469-8b42-b521eda04e8b';

  /**
   * Redirige al usuario al chat de IA con el formulario de intake
   */
  function goToChat() {
    var intakeUrl = FRONTEND_BASE_URL + '/intake?tenantId=' + encodeURIComponent(TENANT_ID);
    window.location.href = intakeUrl;
  }

  /**
   * Inicializa todos los botones de chat con IA en la página
   * Busca botones por clase o ID y les asigna el evento de clic
   */
  function initChatButtons() {
    // Buscar botones por clase 'btn-ai-chat'
    var buttons = document.querySelectorAll('.btn-ai-chat');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', goToChat);
    });

    // IDs específicos de páginas SEO (compatibilidad)
    var specificIds = ['seo-ai-btn', 'seo-ai-mid', 'seo-ai-cta'];
    specificIds.forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', goToChat);
      }
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatButtons);
  } else {
    initChatButtons();
  }

  // Exportar función global para casos especiales
  window.startPublicChat = goToChat;
})();
