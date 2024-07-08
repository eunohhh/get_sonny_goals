const puppeteer = require("puppeteer");
const fs = require("fs");
// const UserAgent = require("user-agents"); // ^1.0.958
const cheerio = require("cheerio");

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: false,
        });
        const page = await browser.newPage();

        // 추가적인 HTTP 헤더 설정
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        });

        // Set screen size
        await page.setViewport({ width: 1920, height: 1080 });

        // 페이지 이동 및 대기
        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        const content = await page.content();
        // $에 cheerio를 로드한다.
        const $ = cheerio.load(content);

        const goals = $(
            "#app > div > div._5DRQ6Phv.a5z6UHjy > article > div.aXXRCC8v > article > div.CVYBZp8c > div > div:nth-child(2) > div.LKVNbZff > div.hh9Bcdpt > div.Bk4No22F.SuHD5-eo > table > tbody > tr:nth-child(16) > td:nth-child(2) > div > strong"
        ).text();

        // // 페이지가 완전히 로드될 때까지 대기
        // await page.waitForSelector(
        //     "#app > div > div._5DRQ6Phv.a5z6UHjy > article > div.aXXRCC8v > article > div.CVYBZp8c > div > div:nth-child(2) > div.LKVNbZff > div.hh9Bcdpt > div.Bk4No22F.SuHD5-eo > table > tbody > tr:nth-child(16) > td:nth-child(2) > div > strong",
        //     { timeout: 60000 }
        // );

        // const goals = await page.evaluate(() => {
        //     const goalElements = document.querySelectorAll(
        //         "#app > div > div._5DRQ6Phv.a5z6UHjy > article > div.aXXRCC8v > article > div.CVYBZp8c > div > div:nth-child(2) > div.LKVNbZff > div.hh9Bcdpt > div.Bk4No22F.SuHD5-eo > table > tbody > tr:nth-child(16) > td:nth-child(2) > div > strong"
        //     );
        //     const goalNumbers = Array.from(goalElements).map((element) => {
        //         return parseInt(element.textContent.replace(/[^0-9]/g, ""), 10);
        //     });
        //     return Math.max(...goalNumbers);
        // });

        const data = {
            player: "Son Heung-min",
            goals: goals,
            timestamp: new Date().toISOString(),
        };

        fs.writeFileSync("goals.json", JSON.stringify(data, null, 2));
        console.log("골 수 데이터를 저장했습니다: ", data);

        await browser.close();
    } catch (error) {
        console.error("에러 발생: ", error);
        process.exit(1); // 에러 발생 시 스크립트를 종료하고 비정상 종료 상태 코드를 반환합니다.
    }
};

getGoals();
