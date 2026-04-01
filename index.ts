import axios from "axios";
import { JSDOM } from "jsdom";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Son_Heung-min";
const EXACT_GOALS_SELECTOR =
  "#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(103) > tbody > tr:nth-child(23) > th:nth-child(11)";
const MAX_RETRIES = 3;
const DEFAULT_RETRY_AFTER_SECONDS = 120;
const MINIMUM_TOTAL_GOALS = 100;

type GoalsData = {
  player: string;
  goals: string;
  timestamp: string;
  source: string;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const extractGoalsFromExactSelector = (document: Document): string | null => {
  const goalsElement = document.querySelector(EXACT_GOALS_SELECTOR);
  const goals = goalsElement?.textContent?.trim();

  if (goals) {
    console.log("정확한 셀렉터로 찾은 골 수:", goals);
    return goals;
  }

  return null;
};

const extractGoalsFromTables = (document: Document): string => {
  console.log("정확한 셀렉터로 요소를 찾을 수 없습니다. 대안 방법을 시도합니다...");

  const tables = document.querySelectorAll("table.wikitable");

  for (const table of tables) {
    const rows = table.querySelectorAll("tr");

    for (const row of rows) {
      const cells = row.querySelectorAll("th, td");

      for (const cell of cells) {
        const text = cell.textContent?.trim().toLowerCase() ?? "";

        if (!text.includes("career total") && !text.includes("total")) {
          continue;
        }

        const numberCells = row.querySelectorAll("th, td");

        for (let index = numberCells.length - 1; index >= 0; index -= 1) {
          const cellText = numberCells[index]?.textContent?.trim() ?? "";

          if (
            /^\d+$/.test(cellText) &&
            Number.parseInt(cellText, 10) > MINIMUM_TOTAL_GOALS
          ) {
            console.log("대안 방법으로 찾은 골 수:", cellText);
            return cellText;
          }
        }
      }
    }
  }

  return "0";
};

const saveGoalsData = (goals: string): void => {
  const data: GoalsData = {
    player: "Son Heung-min",
    goals,
    timestamp: new Date().toISOString(),
    source: "Wikipedia Page (JSDOM + Exact Selector)",
  };

  const categoryPath = path.join("goals");
  if (!existsSync(categoryPath)) {
    mkdirSync(categoryPath, { recursive: true });
    console.log(`Created category directory: ${categoryPath}`);
  }

  const fileName = path.join(categoryPath, "goals.json");
  writeFileSync(fileName, JSON.stringify(data, null, 2));
  console.log("골 수 데이터를 저장했습니다:", data);
};

const getGoals = async (retryCount = 0): Promise<void> => {
  try {
    const response = await axios.get<string>(WIKIPEDIA_URL, {
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
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const goals =
      extractGoalsFromExactSelector(document) ?? extractGoalsFromTables(document);

    console.log("최종 골 수:", goals);
    saveGoalsData(goals);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      console.log(`429 에러 발생. 재시도 중... (${retryCount + 1}/${MAX_RETRIES})`);

      if (retryCount < MAX_RETRIES) {
        const retryAfter =
          Number.parseInt(error.response.headers["retry-after"] ?? "", 10) ||
          DEFAULT_RETRY_AFTER_SECONDS;

        console.log(`${retryAfter}초 후 재시도합니다...`);
        await delay(retryAfter * 1000);
        return getGoals(retryCount + 1);
      }

      console.error("최대 재시도 횟수 초과");
      process.exit(1);
    }

    const message = error instanceof Error ? error.message : "알 수 없는 에러";
    console.error("에러 발생:", message);
    process.exit(1);
  }
};

void getGoals();
