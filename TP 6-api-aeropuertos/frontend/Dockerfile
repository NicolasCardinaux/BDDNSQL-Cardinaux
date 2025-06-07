# Usa una imagen base de Nginx Alpine
FROM nginx:alpine

# Elimina la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copia los archivos estáticos del frontend
COPY ./public /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Comando por defecto de Nginx
CMD ["nginx", "-g", "daemon off;"]