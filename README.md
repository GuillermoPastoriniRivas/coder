
backgroundProcessor.ts

# Instalar pm2
npm install -g pm2

# Ejecutar el servidor principal
pm2 start index.ts --name "agent-server"

# Ejecutar el proceso en segundo plano
pm2 start backgroundProcessor.ts --name "background-processor"