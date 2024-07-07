const puppeteer = require("puppeteer");
const fs = require("fs");

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC");

        // 필요한 데이터가 로드될 때까지 기다립니다.
        await page.waitForSelector("div.OlVG2zQe strong[data-v-4d6812b6]");

        const goals = await page.evaluate(() => {
            const goalElement = document.querySelector("div.OlVG2zQe strong[data-v-4d6812b6]");
            return goalElement.textContent.replace(/[^0-9]/g, "");
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
    }
};

getGoals();
