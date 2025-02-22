(function() {
    // Obtener el agentId desde un atributo de datos en el script
    var scripts = document.getElementsByTagName('script');
    var widgetScript = scripts[scripts.length - 1];
    var agentId = widgetScript.getAttribute('data-agent-id');

    if (!agentId) {
        console.error('No se proporcionó el agentId para el widget de chat.');
        return;
    }

    // Crear el iframe del widget
    var iframe = document.createElement('iframe');
    iframe.src = `${window.location.origin}/widget/${agentId}`;
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.right = '20px';
    iframe.style.width = '400px';
    iframe.style.height = '500px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    iframe.style.zIndex = '1000';

    // Agregar el iframe al cuerpo del documento
    document.body.appendChild(iframe);

    // Opcional: Agregar un botón para cerrar el widget
    var closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '-10px';
    closeButton.style.right = '-10px';
    closeButton.style.background = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '24px';
    closeButton.style.height = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    iframe.contentWindow.document.body.appendChild(closeButton);

    closeButton.addEventListener('click', function() {
        iframe.style.display = 'none';
    });
})();