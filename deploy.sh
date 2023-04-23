# ECR private
#
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 600160064813.dkr.ecr.eu-west-1.amazonaws.com
npm run build
docker build --platform=linux/amd64 -t docker-image:test .
docker tag docker-image:test 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest
docker push 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest                 

# ECR public
#
# aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/y7b1h4a4
# npm run build
# docker build --platform=linux/amd64 -t chss-lambda-ai .
# docker tag chss-lambda-ai:latest public.ecr.aws/y7b1h4a4/chss-lambda-ai:latest
# docker push public.ecr.aws/y7b1h4a4/chss-lambda-ai:latest