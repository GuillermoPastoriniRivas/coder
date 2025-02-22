(function() {
    // Crear una función para insertar el widget
    function insertWidget(agentId) {
        // Crear el script que cargará el widget
        var script = document.createElement('script');
        script.src = './widget.js';
        script.setAttribute('data-agent-id', agentId);
        script.async = true;
        document.body.appendChild(script);
    }

    // Exponer la función globalmente
    window.ChatWidget = {
        init: insertWidget
    };
})();