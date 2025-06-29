const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 지연 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGoals = async (retryCount = 0) => {
  try {
    // 일반 Wikipedia 페이지 사용 (API보다 제한이 덜 엄격)
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

    const htmlContent = response.data;

    // 정확한 셀렉터를 사용하여 골 수 찾기
    let goals = "0";

    // 정확한 CSS 셀렉터에 해당하는 패턴
    // #mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(103) > tbody > tr:nth-child(23) > th:nth-child(11)

    // 테이블들을 찾기
    const tablePattern = /<table[^>]*class="wikitable"[^>]*>.*?<\/table>/gs;
    const tables = htmlContent.match(tablePattern);

    if (tables && tables.length >= 103) {
      // 103번째 테이블 (nth-child(103))
      const targetTable = tables[102]; // 0-based index

      // 테이블 내의 행들을 찾기
      const rowPattern = /<tr[^>]*>.*?<\/tr>/gs;
      const rows = targetTable.match(rowPattern);

      if (rows && rows.length >= 23) {
        // 23번째 행 (nth-child(23))
        const targetRow = rows[22]; // 0-based index

        // 행 내의 셀들을 찾기
        const cellPattern = /<t[dh][^>]*>.*?<\/t[dh]>/gs;
        const cells = targetRow.match(cellPattern);

        if (cells && cells.length >= 11) {
          // 11번째 셀 (nth-child(11))
          const targetCell = cells[10]; // 0-based index

          // 셀 내용에서 숫자 추출
          const numberPattern = /(\d+)/;
          const match = targetCell.match(numberPattern);
          if (match) {
            goals = match[1];
          }
        }
      }
    }

    console.log("골 수: ", goals);

    const data = {
      player: "Son Heung-min",
      goals: goals,
      timestamp: new Date().toISOString(),
      source: "Wikipedia Page (Exact Selector)",
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
