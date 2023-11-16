e:
	python extract.py
build:
	npm run build

dev: e
	npm run dev
start:
	npm run start

build-docker: e build
	sudo docker build -t mh.com:8890/blog/blog:v1.0 .
	sudo docker push mh.com:8890/blog/blog:v1.0

stop-k8s:
	kubectl delete -f k8s/deployment.yaml
start-k8s:
	kubectl apply -f k8s/deployment.yaml

restart-k8s: stop-k8s start-k8s
	echo "Restart Success"

reborn: build-docker restart-k8s
	echo "Reborn Success"
restart-docker:
	sudo docker stop blog && \
	sudo docker rm blog && \
	sudo docker run -d --restart always --name blog -p 9527:3000 mh.com:8890/blog/blog:v1.0
