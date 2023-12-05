FROM node:18.19-alpine

ENV HOME=/home/app

WORKDIR $HOME

COPY package.json $HOME/
COPY package-lock.json $HOME/
RUN npm i

COPY . $HOME

RUN npm run build

CMD ["node", "dist/app.js"]
