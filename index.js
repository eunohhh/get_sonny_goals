const puppeteer = require("puppeteer");
const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // 추가적인 HTTP 헤더 설정
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        });

        // 화면 크기 설정
        await page.setViewport({ width: 1920, height: 1080 });

        
        // 페이지 이동 및 대기
        await page.goto("https://en.wikipedia.org/wiki/Son_Heung-min", {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        const content = await page.content();

        // cheerio 로드
        const $ = cheerio.load(content);

        // "#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(103) > tbody > tr:nth-child(22) > th:nth-child(15)" 한국어 위키일경우
        // "#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(108) > tbody > tr:nth-child(23) > th:nth-child(11)" 영어 위키일경우
        const goals = $(
            "#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(108) > tbody > tr:nth-child(23) > th:nth-child(11)"
        );

        console.log("골 수: ", goals.text());

        const data = {
            player: "Son Heung-min",
            goals: goals.text().replace(/\n/g, ""),
            timestamp: new Date().toISOString(),
        };

        // 'goals' 폴더 생성 및 데이터 파일 저장
        const categoryPath = path.join("goals");
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
            console.log(`Created category directory: ${categoryPath}`);
        }
        const fileName = path.join(categoryPath, "goals.json");
        fs.writeFileSync(fileName, JSON.stringify(data, null, 2));

        console.log("골 수 데이터를 저장했습니다: ", data);

        await browser.close();
    } catch (error) {
        console.error("에러 발생: ", error);
        process.exit(1);
    }
};

getGoals();