FROM public.ecr.aws/lambda/nodejs:16

ADD package.json .
RUN npm install

ADD chss-module-engine ./chss-module-engine
ADD tfjs_model ./tfjs_model

COPY index.mjs ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]