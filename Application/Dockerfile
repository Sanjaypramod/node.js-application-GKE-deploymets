# FROM node:13-alpine
FROM node:20.19.6-alpine
RUN mkdir -p /home/app
COPY ./* /home/app/
WORKDIR /home/app
RUN npm install
CMD ["node", "index.js"]
