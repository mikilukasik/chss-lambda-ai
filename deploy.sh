docker build --platform=linux/amd64 -t docker-image:test .

docker tag docker-image:test 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest

docker push 600160064813.dkr.ecr.eu-west-1.amazonaws.com/test:latest                 

