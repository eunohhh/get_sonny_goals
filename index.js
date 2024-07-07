const puppeteer = require("puppeteer");
const fs = require("fs");

const getGoals = async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", { timeout: 60000 });

        // 필요한 데이터가 로드될 때까지 기다립니다.
        const datas = await page.waitForSelector("tbody", { timeout: 60000 }); // 대기 시간을 60초로 설정

        console.log(datas);

        const goals = await datas.evaluate(() => {
            const goalElements = document.querySelectorAll("tbody tr td div.OlVG2zQe strong");
            console.log(goalElements);
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
