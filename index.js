const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const getGoals = async () => {
    try {
        const response = await axios.get("https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC", {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            },
        });
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

        if (fs.existsSync("goals.json")) {
            console.log("goals.json 파일이 생성되었습니다.");
        } else {
            console.error("goals.json 파일 생성에 실패했습니다.");
        }
    } catch (error) {
        console.error("에러 발생: ", error);
    }
};

getGoals();
