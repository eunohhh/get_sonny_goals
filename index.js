const puppeteer = require("puppeteer");
const fs = require("fs");
const UserAgent = require("user-agents"); // ^1.0.958

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        const userAgent = new UserAgent({ deviceCategory: "desktop" });
        await page.setUserAgent(userAgent.random().toString());
        // 추가적인 HTTP 헤더 설정
        await page.setExtraHTTPHeaders({
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            Accept: "*/*",
        });

        // await page.waitForResponse((response) => response.status() === 200, { timeout: 60000 });

        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", { waitUntil: "domcontentloaded" });

        // Set screen size
        await page.setViewport({ width: 1920, height: 1080 });

        // 네트워크 활동 대기

        // HTML 콘텐츠 출력
        const content = await page.content();
        console.log(content);

        // 필요한 데이터가 로드될 때까지 기다립니다.
        const datas = await page.waitForSelector(".XJfLa7V4", { timeout: 60000 }); // 대기 시간을 60초로 설정

        console.log(datas);

        const goals = await datas.evaluate(() => {
            const goalElements = document.querySelectorAll(".XJfLa7V4 > tbody tr");
            console.log(goalElements);
            const goalNumbers = Array.from(goalElements).map((element, idx) => {
                if (idx === 15) {
                    return parseInt(element.children[1].children[0].children[0].textContent.replace(/[^0-9]/g, ""), 10);
                }
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
