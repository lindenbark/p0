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
npm run dev
# 웹 브라우저에서 localhost:1234 접속
```

## 실서버에 올리는 법
master 브랜치에 커밋후 푸시하면 됩니다.

## 접속한 클라별 rtt 확인하는법
어떤 방식으로든 띄운 다음에 `http://localhost:10002/rtts`로 접속합니다.
