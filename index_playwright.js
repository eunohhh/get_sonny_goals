const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const getGoals = async () => {
  try {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    // 페이지 이동
    await page.goto("https://en.wikipedia.org/wiki/Son_Heung-min", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 더 안정적인 선택자 사용
    const goals = await page.evaluate(() => {
      const tables = document.querySelectorAll("table.wikitable");
      if (tables.length === 0) return "0";

      const lastTable = tables[tables.length - 1];
      const cells = lastTable.querySelectorAll("th, td");

      // 숫자가 포함된 셀들을 찾아서 마지막 숫자를 골 수로 간주
      for (let i = cells.length - 1; i >= 0; i--) {
        const cellText = cells[i].textContent.trim();
        if (/^\d+$/.test(cellText) && Number.parseInt(cellText) > 0) {
          return cellText;
        }
      }
      return "0";
    });

    console.log("골 수: ", goals);

    const data = {
      player: "Son Heung-min",
      goals: goals,
      timestamp: new Date().toISOString(),
      source: "Playwright",
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
