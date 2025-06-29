const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const getGoals = async () => {
  try {
    // Wikipedia API 사용
    const response = await axios.get(
      "https://en.wikipedia.org/api/rest_v1/page/html/Son_Heung-min",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    // JSDOM으로 HTML 파싱
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 더 정확한 선택자 사용
    const tables = document.querySelectorAll("table.wikitable");
    let goals = "0";

    // 마지막 테이블에서 골 수 찾기
    if (tables.length > 0) {
      const lastTable = tables[tables.length - 1];
      const cells = lastTable.querySelectorAll("th, td");

      // 숫자가 포함된 셀들을 찾아서 마지막 숫자를 골 수로 간주
      for (let i = cells.length - 1; i >= 0; i--) {
        const cellText = cells[i].textContent.trim();
        if (/^\d+$/.test(cellText) && Number.parseInt(cellText) > 0) {
          goals = cellText;
          break;
        }
      }
    }

    console.log("골 수: ", goals);

    const data = {
      player: "Son Heung-min",
      goals: goals,
      timestamp: new Date().toISOString(),
      source: "Wikipedia API + JSDOM",
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
  } catch (error) {
    console.error("에러 발생: ", error);
    process.exit(1);
  }
};

getGoals();
