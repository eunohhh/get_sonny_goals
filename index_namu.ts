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

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [30_000, 60_000];

const sleep = async (milliseconds: number): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const saveGoalsData = async (goals: number | null): Promise<void> => {
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

const getNamuGoals = async (): Promise<number> => {
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
			waitUntil: "domcontentloaded",
			timeout: 60000,
		});

		const title = await page.title();
		console.log("페이지 타이틀:", title);
		if (title === "Just a moment..." || title.toLowerCase().includes("cloudflare")) {
			throw new Error(`나무위키 접근이 차단되었습니다 (페이지 타이틀: ${title})`);
		}

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

		if (!goals) {
			const htmlLength = (await page.content()).length;
			throw new Error(`통산 득점을 찾을 수 없습니다 (HTML 길이: ${htmlLength})`);
		}

		return Number(goals);
	} finally {
		await browser.close();
	}
};

const fetchGoalsWithRetry = async (): Promise<number | null> => {
	let lastError = "알 수 없는 에러";

	for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
		try {
			const goals = await getNamuGoals();
			console.log(`통산 득점: ${goals}`);
			return goals;
		} catch (error: unknown) {
			lastError = error instanceof Error ? error.message : String(error);
			console.error(
				`나무위키 조회 실패 (${attempt}/${MAX_FETCH_ATTEMPTS}): ${lastError}`,
			);

			if (attempt < MAX_FETCH_ATTEMPTS) {
				const delay = RETRY_DELAYS_MS[attempt - 1];
				console.log(`${delay / 1000}초 후 재시도합니다...`);
				await sleep(delay);
			}
		}
	}

	console.error(
		`최대 재시도 횟수를 초과했습니다. 마지막 오류: ${lastError}`,
	);
	return null;
};

const run = async (): Promise<void> => {
	const goals = await fetchGoalsWithRetry();

	if (goals === null) {
		console.error("오늘의 골 수를 확인하지 못해 null로 기록합니다.");
	}

	await saveGoalsData(goals);
};

void run().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`오늘 기록 저장에 실패했습니다: ${message}`);
	process.exitCode = 1;
});
