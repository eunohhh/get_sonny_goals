import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import type { Database } from "./types/supabase";

const NAMU_WIKI_URL = "https://namu.wiki/w/%EC%86%90%ED%9D%A5%EB%AF%BC";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

const saveGoalsData = async (goals: number): Promise<void> => {
  const { error } = await supabase.from("goals").insert({
    goals,
    name: "Son Heung-min",
    source: "Namu Wiki (Playwright)",
  });

  if (error) {
    throw new Error(`Supabase insert 실패: ${error.message}`);
  }

  console.log("Supabase에 골 수 데이터를 저장했습니다:", {
    goals,
    name: "Son Heung-min",
  });
};

const getNamuGoals = async (): Promise<void> => {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      locale: "ko-KR",
    });
    const page = await context.newPage();
    console.log("나무위키 페이지 접근 중...");

    await page.goto(NAMU_WIKI_URL, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const title = await page.title();
    console.log("페이지 타이틀:", title);

    const goals = await page.evaluate(() => {
      const strongElements = document.querySelectorAll("strong");
      for (const el of strongElements) {
        if (el.textContent?.trim() === "통산 득점") {
          const row = el.closest("tr");
          if (!row) continue;

          const cells = row.querySelectorAll("td");
          for (const cell of cells) {
            const match = cell.textContent?.match(/(\d+)골/);
            if (match) {
              return match[1];
            }
          }
        }
      }
      return null;
    });

    if (goals) {
      console.log("통산 득점:", goals);
      await saveGoalsData(Number(goals));
    } else {
      const html = await page.content();
      console.error("통산 득점을 찾을 수 없습니다");
      console.error("HTML 길이:", html.length);
      console.error("HTML 미리보기 (처음 1000자):");
      console.error(html.substring(0, 1000));
      process.exit(1);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 에러";
    console.error("에러 발생:", message);
    process.exit(1);
  } finally {
    await browser.close();
  }
};

void getNamuGoals();
