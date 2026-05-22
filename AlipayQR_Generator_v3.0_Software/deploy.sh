#!/bin/bash
# AlipayQR v3.0 - 一键部署
set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   AlipayQR v3.0 - 一键部署${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
PLATFORM=${1:-help}
case $PLATFORM in
    github|gh)
        echo -e "${YELLOW}[*] 部署到 GitHub Pages...${NC}"
        if ! command -v git &> /dev/null; then echo -e "${RED}[!] 需要安装Git${NC}"; exit 1; fi
        if [ ! -d ".git" ]; then git init; git branch -M main; fi
        git checkout -b gh-pages 2>/dev/null || git checkout gh-pages
        cp reddit-showcase.html index.html
        git add .; git commit -m "Deploy to GitHub Pages" || true
        echo -e "${GREEN}[+] GitHub Pages部署文件已准备${NC}"
        echo -e "${CYAN}下一步: 创建GitHub仓库并推送 gh-pages 分支${NC}"
        ;;
    vercel)
        echo -e "${YELLOW}[*] 部署到 Vercel...${NC}"
        if ! command -v npx &> /dev/null; then echo -e "${RED}[!] 需要安装Node.js${NC}"; exit 1; fi
        npm install -g vercel; vercel --prod
        echo -e "${GREEN}[+] Vercel部署完成${NC}"
        ;;
    netlify)
        echo -e "${YELLOW}[*] 部署到 Netlify...${NC}"
        if ! command -v npx &> /dev/null; then echo -e "${RED}[!] 需要安装Node.js${NC}"; exit 1; fi
        npm install -g netlify-cli; netlify deploy --prod --dir=src/ui/web
        echo -e "${GREEN}[+] Netlify部署完成${NC}"
        ;;
    reddit|post)
        echo -e "${YELLOW}[*] Reddit发布准备...${NC}"
        echo -e "${CYAN}推荐Subreddit:${NC}"
        echo "  r/selfhosted | r/coolgithubprojects | r/SideProject | r/webdev | r/opensource"
        echo -e "${CYAN}帖子内容: REDDIT_POST.md${NC}"
        echo -e "${CYAN}展示页面: reddit-showcase.html${NC}"
        ;;
    help|*)
        echo -e "${CYAN}使用方式: ./deploy.sh [平台]${NC}"
        echo "支持: github | vercel | netlify | reddit"
        ;;
esac
echo ""
