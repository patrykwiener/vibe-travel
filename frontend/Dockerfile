FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install  --verbose

COPY . .

EXPOSE 5173

# Set the correct environment variables
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
