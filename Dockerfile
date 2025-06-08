# 1. Basis-Image
FROM node:18-alpine

# 2. Arbeitsverzeichnis
WORKDIR /app

# 3. Nur package.json & lock für Cache
COPY package*.json ./

# 4. Dependencies installieren
RUN npm install

# 5. Restlichen Code kopieren
COPY . .

# 6. Produktionsbuild
RUN npm run build

# 7. Port 3000 öffnen (Next.js Standard)
EXPOSE 3000

# 8. Production-Start
CMD ["npm", "start"]
