
FROM node:24

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar archivos de la aplicación
COPY index.js .
COPY products.json .
COPY cart.json .

# Crear y copiar directorio public
COPY public/ ./public/

EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
