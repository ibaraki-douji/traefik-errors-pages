FROM node:alpine as build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY tsconfig.json ./
COPY ./src ./src

RUN npm run build

FROM node:alpine as production

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install --only=production

# Bundle app source
COPY --from=build /usr/src/app/lib ./lib

WORKDIR /usr/src/app

EXPOSE 3000

CMD ["npm" , "run", "start"]