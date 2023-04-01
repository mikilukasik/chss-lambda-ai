aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 600160064813.dkr.ecr.eu-west-1.amazonaws.com

npm run build

docker build --platform=linux/amd64 -t docker-image:test .
# docker run -p 9000:8080 docker-image:test         

docker tag docker-image:test 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest

docker push 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest                 

