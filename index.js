const puppeteer = require("puppeteer");
const fs = require("fs");

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // 페이지 이동 및 대기
        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", { timeout: 60000 });

        // 네트워크 활동 대기
        await page.waitForResponse((response) => response.status() === 200);

        // HTML 콘텐츠 출력
        const content = await page.content();
        console.log(content);

        // 페이지 스크린샷 찍기 (디버깅용)
        await page.screenshot({ path: "page.png", fullPage: true });

        // 요소 대기
        const selected = await page.waitForSelector("tbody tr td div.OlVG2zQe strong", { timeout: 60000 });

        console.log(selected);

        // 요소 평가
        const goals = await page.evaluate(() => {
            const goalElements = document.querySelectorAll("tbody tr td div.OlVG2zQe strong");
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
