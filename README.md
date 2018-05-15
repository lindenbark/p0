# p0

첫 프로토타입

## 돌리는 법
```sh
docker-compose up --build
# 웹 브라우저에서 localhost 접속
```

## 개발용도로 돌리는 법
```sh
npm install
npm run dev # 클라이언트
npm run start # 서버
```

## 실서버에 올리는 법
```sh
# vultr ssh 접속
su - docker
cd p0
git pull origin master
docker-compose up --build -d
```
