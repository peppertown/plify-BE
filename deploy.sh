#!/bin/bash

# 색상 출력
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "${GREEN}📦 1. 로컬에서 NestJS 빌드 시작...${NC}"
npm run build

echo "${GREEN}🚀 2. dist + prisma 폴더 EC2로 업로드 중...${NC}"
scp -i /Users/donghyun/Downloads/back.pem -r dist/ prisma/ package.json package-lock.json tsconfig.build.json nest-cli.json ubuntu@ec2-3-34-44-18.ap-northeast-2.compute.amazonaws.com:~/plify-BE/

echo "${GREEN}🔄 3. EC2 접속 후 npm install, prisma generate & PM2 재시작 중...${NC}"
ssh -i /Users/donghyun/Downloads/back.pem ubuntu@ec2-3-34-44-18.ap-northeast-2.compute.amazonaws.com << 'EOF'
  cd ~/plify-BE
  npm install --legacy-peer-deps
  npx prisma generate
  pm2 restart ecosystem.config.js
  echo "✅ PM2 재시작 완료!"
EOF

echo "${GREEN}🎉 배포 완료!${NC}"