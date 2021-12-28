FROM node:14

WORKDIR /app

ENV NODE_ENV=production

COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --production=false

COPY tsconfig.json .
COPY src ./src

CMD ["yarn", "start"]
