const puppeteer = require("puppeteer");
const fs = require("fs");
// const UserAgent = require("user-agents"); // ^1.0.958

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process", // <- 이것이 없으면 Docker에서 문제가 발생할 수 있습니다.
                "--disable-gpu",
            ],
        });
        const page = await browser.newPage();

        // 추가적인 HTTP 헤더 설정
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        });

        // 페이지 이동 및 대기
        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });

        // 페이지가 완전히 로드될 때까지 대기
        await page.waitForSelector(".OlVG2zQe strong", { timeout: 60000 });

        const goals = await page.evaluate(() => {
            const goalElements = document.querySelectorAll(".OlVG2zQe strong");
            const goalNumbers = Array.from(goalElements).map((element) => {
                return parseInt(element.textContent.replace(/[^0-9]/g, ""), 10);
            });
            return Math.max(...goalNumbers);
        });

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
