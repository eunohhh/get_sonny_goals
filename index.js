const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const getGoals = async () => {
    try {
        const response = await axios.get("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC");
        const html = response.data;
        const $ = cheerio.load(html);
        const goalElement = $("div.OlVG2zQe strong[data-v-4d6812b6]").first();
        const goals = goalElement.text().replace(/[^0-9]/g, "");

        const data = {
            player: "Son Heung-min",
            goals: goals,
            timestamp: new Date().toISOString(),
        };

        fs.writeFileSync("goals.json", JSON.stringify(data, null, 2));
        console.log("골 수 데이터를 저장했습니다: ", data);
    } catch (error) {
        console.error("에러 발생: ", error);
    }
};

getGoals();
