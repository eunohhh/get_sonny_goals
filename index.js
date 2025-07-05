const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

// 지연 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGoals = async (retryCount = 0) => {
  try {
    // 일반 Wikipedia 페이지 사용
    const response = await axios.get(
      "https://en.wikipedia.org/wiki/Son_Heung-min",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 15000,
      }
    );

    // JSDOM으로 HTML 파싱
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 정확한 CSS 셀렉터 사용
    // #mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(103) > tbody > tr:nth-child(23) > th:nth-child(11)
    const goalsElement = document.querySelector(
      "#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(103) > tbody > tr:nth-child(23) > th:nth-child(11)"
    );

    let goals = "0";

    if (goalsElement) {
      goals = goalsElement.textContent.trim();
      console.log("정확한 셀렉터로 찾은 골 수: ", goals);
    } else {
      console.log(
        "정확한 셀렉터로 요소를 찾을 수 없습니다. 대안 방법을 시도합니다..."
      );

      // 대안: 모든 테이블에서 "Career total" 행 찾기
      const tables = document.querySelectorAll("table.wikitable");
      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        for (const row of rows) {
          const cells = row.querySelectorAll("th, td");
          for (const cell of cells) {
            const text = cell.textContent.trim();
            if (
              text.toLowerCase().includes("career total") ||
              text.toLowerCase().includes("total")
            ) {
              // 이 행에서 숫자 찾기
              const numberCells = row.querySelectorAll("th, td");
              for (let i = numberCells.length - 1; i >= 0; i--) {
                const cellText = numberCells[i].textContent.trim();
                if (/^\d+$/.test(cellText) && Number.parseInt(cellText) > 100) {
                  goals = cellText;
                  console.log("대안 방법으로 찾은 골 수: ", goals);
                  break;
                }
              }
              if (goals !== "0") break;
            }
          }
          if (goals !== "0") break;
        }
        if (goals !== "0") break;
      }
    }

    // 테스트용 코드 222
    console.log("최종 골 수: ", goals);

    const data = {
      player: "Son Heung-min",
      goals: goals,
      timestamp: new Date().toISOString(),
      source: "Wikipedia Page (JSDOM + Exact Selector)",
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
    if (error.response && error.response.status === 429) {
      console.log(`429 에러 발생. 재시도 중... (${retryCount + 1}/3)`);

      if (retryCount < 3) {
        // 더 긴 지연 시간 사용
        const retryAfter =
          Number.parseInt(error.response.headers["retry-after"]) || 120;
        console.log(`${retryAfter}초 후 재시도합니다...`);

        await delay(retryAfter * 1000);
        return getGoals(retryCount + 1);
      }

      console.error("최대 재시도 횟수 초과");
      process.exit(1);
    }

    console.error("에러 발생: ", error.message);
    process.exit(1);
  }
};

getGoals();
