FROM node:20-alpine

# Install compatibility library for Prisma to run on Alpine Linux
RUN apk add --no-cache libc6-compat openssl

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Copy Prisma schema and generate client binaries
COPY prisma ./prisma

# Install npm packages (also runs prisma generate via postinstall)
RUN npm install

# Copy remaining source code
COPY . .

# Expose backend server port
EXPOSE 5001

# Run migration fix + db push THEN start the server in one command
CMD ["sh", "-c", "npm run build && npm start"]
