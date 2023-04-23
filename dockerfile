FROM public.ecr.aws/lambda/nodejs:16

ADD models ./models
ADD package.json .
RUN npm install

ADD chss-module-engine ./chss-module-engine
ADD dist ./dist

CMD [ "dist/index.handler" ]