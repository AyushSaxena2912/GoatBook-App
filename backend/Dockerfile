FROM node:20-alpine

# Install compatibility library for Prisma to run on Alpine Linux
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy Prisma schema and generate client binaries
COPY prisma ./prisma
RUN npx prisma generate

# Copy remaining source code
COPY . .

# Expose backend server port
EXPOSE 5001

# Run the startup script
CMD ["npm", "start"]
