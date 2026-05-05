FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8000

CMD sh -c "pnpm prisma generate && npx prisma migrate deploy && node prisma/seed.js && node src/app.js"