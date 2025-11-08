import { humanClick, humanType, humanPauseToRead, humanScrollRead } from '../behavior.js';
import { sleep, jitter, randInt } from '../utils.js';

// Gerçekçi anket yanıtları
const likertScale = ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Ne Katılıyorum Ne Katılmıyorum', 'Katılıyorum', 'Kesinlikle Katılıyorum'];
const yesNo = ['Evet', 'Hayır'];
const frequency = ['Hiç', 'Nadiren', 'Bazen', 'Sıklıkla', 'Her zaman'];
const satisfaction = ['Çok Memnunum', 'Memnunum', 'Kararsızım', 'Memnun Değilim', 'Hiç Memnun Değilim'];

const commonAnswers = {
  age: () => String(randInt(22, 45)),
  gender: () => ['Erkek', 'Kadın', 'Belirtmek İstemiyorum'][randInt(0, 2)],
  email: (site) => site?.email || 'example@mail.com',
  country: () => 'Turkey',
  city: () => ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'][randInt(0, 4)],
  likert: () => likertScale[randInt(1, 3)], // orta değerler tercih
  yesno: () => yesNo[randInt(0, 1)],
  frequency: () => frequency[randInt(1, 3)],
  satisfaction: () => satisfaction[randInt(0, 2)],
  rating: (max = 5) => String(randInt(Math.floor(max * 0.6), max)), // %60+ puan
  openText: () => ['Gayet iyi.', 'Memnun kaldım.', 'İyi deneyim.', 'Beğendim.', 'Sorun yok.'][randInt(0, 4)],
};

function detectQuestionType(questionText) {
  const txt = questionText.toLowerCase();
  if (/(likert|katıl|agree|disagree)/i.test(txt)) return 'likert';
  if (/(yes|no|evet|hayır)/i.test(txt)) return 'yesno';
  if (/(frequency|sıklık|often)/i.test(txt)) return 'frequency';
  if (/(satisfaction|memnun)/i.test(txt)) return 'satisfaction';
  if (/(age|yaş)/i.test(txt)) return 'age';
  if (/(gender|cinsiyet)/i.test(txt)) return 'gender';
  if (/(country|ülke)/i.test(txt)) return 'country';
  if (/(city|şehir)/i.test(txt)) return 'city';
  if (/(rating|puan|star)/i.test(txt)) return 'rating';
  if (/(email|e-posta)/i.test(txt)) return 'email';
  return 'openText';
}

function generateAnswer(type, site, maxRating) {
  const gen = commonAnswers[type];
  if (gen) return gen(maxRating || site);
  return commonAnswers.openText();
}

async function answerQuestion(page, questionEl, site) {
  const questionText = (await questionEl.innerText().catch(() => ''))?.trim() || '';
  const type = detectQuestionType(questionText);

  // Radio/checkbox
  const radios = questionEl.locator('input[type="radio"], input[type="checkbox"]');
  const radioCount = await radios.count();
  if (radioCount > 0) {
    const answer = generateAnswer(type, site);
    // Etiketlerle eşleşme dene
    for (let i = 0; i < radioCount; i++) {
      const label = await radios.nth(i).locator('..').innerText().catch(() => '');
      if (label.includes(answer)) {
        await humanClick(page, radios.nth(i));
        return;
      }
    }
    // Eşleşme yoksa orta seçenek
    const mid = Math.floor(radioCount / 2);
    await humanClick(page, radios.nth(mid));
    return;
  }

  // Select dropdown
  const select = questionEl.locator('select').first();
  if (await select.isVisible().catch(() => false)) {
    const answer = generateAnswer(type, site);
    await select.selectOption({ label: answer }).catch(() => {
      const opts = select.locator('option');
      const cnt = opts.count();
      opts.nth(randInt(1, Math.max(1, cnt - 1))).click();
    });
    return;
  }

  // Text input
  const textInput = questionEl.locator('input[type="text"], input[type="email"], input[type="number"], textarea').first();
  if (await textInput.isVisible().catch(() => false)) {
    const answer = generateAnswer(type, site);
    await textInput.fill('');
    await humanType(textInput, answer);
    return;
  }

  // Rating stars
  const stars = questionEl.locator('[role="radiogroup"] button, .rating button, .star');
  const starCount = await stars.count();
  if (starCount > 0) {
    const rating = Number(generateAnswer('rating', site, starCount));
    await humanClick(page, stars.nth(Math.min(rating - 1, starCount - 1)));
    return;
  }
}

export async function runSurveyTask(page, task, site) {
  const card = task.locator;

  const openBtn = card.locator(
    'a:has-text("Start"), a:has-text("Begin"), button:has-text("Start"), button:has-text("Begin")'
  ).first();
  if (await openBtn.isVisible().catch(() => false)) {
    await humanClick(page, openBtn);
  } else {
    await humanClick(page, card);
  }

  await page.waitForLoadState('domcontentloaded');
  await humanPauseToRead(page, page.locator('main, body'));

  // Çok adımlı ankete basit döngü
  for (let step = 0; step < 30; step++) {
    // Sorular/input grupları
    const questions = page.locator('form [data-question], form fieldset, form .question, form > div');
    const qCount = await questions.count();
    if (qCount === 0) break;

    for (let i = 0; i < Math.min(qCount, 10); i++) {
      await answerQuestion(page, questions.nth(i), site);
      await sleep(jitter(400));
    }

    await humanScrollRead(page, { segments: 2 });

    // Next/Submit buton
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Submit"), button[type="submit"]').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await humanClick(page, nextBtn);
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await sleep(jitter(1500));
    } else {
      break;
    }

    // Tamamlanma sinyali
    if (await page.locator('text=Thank you, text=Completed, text=Success').first().isVisible().catch(() => false)) {
      break;
    }
  }
}
