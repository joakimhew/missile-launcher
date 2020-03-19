FROM arm32v7/node

ENV IOT_KEY_PATH=test_device.private.key
ENV IOT_CERT_PATH=test_device.cert.pem
ENV IOT_CLIENT_ID=
ENV IOT_HOST=

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  python \
  make \
  g++ \
  build-essential \
  libudev-dev

COPY package*.json ./

RUN npm install

RUN curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root-CA.crt

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]