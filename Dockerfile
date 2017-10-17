FROM node: 8.7.0

RUN mkdir /koaСhat

COPY package.json /koaСhat

WORKDIR /koaСhat

RUN npm install

COPY . /koaСhat

EXPOSE 3000

CMD ["node", "index.js"]
