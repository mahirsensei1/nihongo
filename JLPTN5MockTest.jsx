import React, { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, Volume2, CheckCircle2, XCircle, Lock, Headphones, BookOpen, AlertTriangle, RotateCcw, Trophy, Timer, FileText, Send } from "lucide-react";

/* =====================================================================
   MOCK TEST DATA. To add a test, append an object to MOCK_TESTS.
   - listeningComingSoon: true  -> Part 3 shows the "Coming Soon / 準備中" screen
                                    and the score is out of 120 (Section A only).
   - listeningComingSoon: false -> Part 3 is a real listening paper (Web Speech API, ja-JP)
                                    and the score is out of 180.
   - {{text}} in a prompt renders underlined.
   - type "star": options are the 4 word choices; the learner picks the word for the ★ slot.
     "star.order" is the correct sentence order, "star.star" is the ★ index.
   - Listening: "script" lines are spoken (v: m = male, f = female, n = narrator).
   - A "mondai" may carry a shared "passage" (reading / notice) shown above its questions.
   ===================================================================== */
const P1 = "わたしの いえは えきから ちかいです。えきの まえに スーパーが あります。スーパーの となりに ほんやが あります。まいにち ごじに かいしゃから かえります。それから スーパーで かいものを します。";
const INFO1 = "ぎんこうの おしらせ\nげつようびから きんようびまで：9:00〜5:00\nどようび：9:00〜12:00\nにちようび：やすみ";
const P2 = "きのう わたしは こうえんへ いきました。こうえんには おおきい きが ありました。きの したで ほんを よみました。あめが ふりましたから、うちへ かえりました。";
const INFO2 = "としょかんの あんない\nひらく じかん：9:00〜6:00\nやすみ：げつようび";

const MOCK_TESTS = [
  { id: 1, title: "JLPT N5 Mock Test 01", listeningComingSoon: true, parts: [
    { id: 1, title: "Language Knowledge: Vocabulary", jp: "言語知識（文字・語彙）", minutes: 20, mondai: [
      { jp: "問題1　＿＿の ことばは ひらがなで どう かきますか。", en: "Choose the hiragana reading of the underlined kanji.", questions: [
        { id: "1v1", type: "kanji", prompt: "{{先生}}は きょう がっこうに います。", options: ["せんぜい", "せんせい", "しんせい", "しんぜい"], answer: 1, expEn: "先生 is read せんせい (teacher).", expJa: "「先生」は「せんせい」と読みます。" },
        { id: "1v2", type: "kanji", prompt: "{{小さい}} いぬが います。", options: ["ちいさい", "ちさい", "しょうさい", "こさい"], answer: 0, expEn: "小さい is read ちいさい (small).", expJa: "「小さい」は「ちいさい」と読みます。" }] },
      { jp: "問題2　＿＿の ことばは どう かきますか。", en: "Choose the correct kanji or katakana for the underlined hiragana.", questions: [
        { id: "1v3", type: "ortho", prompt: "あした {{ともだち}}に あいます。", options: ["支だち", "反だち", "友だち", "発だち"], answer: 2, expEn: "ともだち (friend) is written 友だち.", expJa: "「ともだち」は「友だち」と書きます。" },
        { id: "1v4", type: "ortho", prompt: "あそこに {{ほてる}}が あります。", options: ["ポテル", "ホテノレ", "ボテル", "ホテル"], answer: 3, expEn: "Loanwords such as hotel are written in katakana: ホテル.", expJa: "外来語は片仮名で「ホテル」と書きます。" }] },
      { jp: "問題3　（　）に なにを いれますか。", en: "Choose the best word to fill the blank.", questions: [
        { id: "1v5", type: "context", prompt: "あついですから、（　）を のみます。", options: ["てがみ", "みず", "かさ", "くつ"], answer: 1, expEn: "You drink water (みず) when it is hot.", expJa: "暑いときは「水」を飲みます。" },
        { id: "1v6", type: "context", prompt: "ははは いま おふろに （　）います。", options: ["あって", "いって", "はいって", "のって"], answer: 2, expEn: "おふろに はいります = take a bath.", expJa: "「おふろに入る」を使います。" }] },
      { jp: "問題4　＿＿の ぶんと だいたい おなじ いみの ぶんが あります。", en: "Choose the sentence closest in meaning.", questions: [
        { id: "1v7", type: "para", prompt: "この へやは しずかです。", options: ["この へやは うるさくないです。", "この へやは あかるいです。", "この へやは ひろいです。", "この へやは あついです。"], answer: 0, expEn: "しずか (quiet) is close to うるさくない (not noisy).", expJa: "「静か」は「うるさくない」と同じ意味です。" },
        { id: "1v8", type: "para", prompt: "ははは びょうきです。", options: ["ははは いそがしいです。", "ははは ひまです。", "ははは しずかです。", "ははは げんきじゃありません。"], answer: 3, expEn: "びょうき (sick) means not healthy: げんきじゃありません.", expJa: "「病気」は「元気じゃない」ということです。" }] },
    ]},
    { id: 2, title: "Language Knowledge: Grammar and Reading", jp: "言語知識（文法）・読解", minutes: 40, mondai: [
      { jp: "問題1　（　）に なにを いれますか。", en: "Choose the correct particle.", questions: [
        { id: "1g1", type: "grammar", prompt: "わたしは ろくじ（　）おきます。", options: ["を", "に", "で", "が"], answer: 1, expEn: "に marks a specific time.", expJa: "時刻には助詞「に」を使います。" },
        { id: "1g2", type: "grammar", prompt: "A：なにで がっこうへ いきますか。　B：でんしゃ（　）いきます。", options: ["で", "を", "に", "が"], answer: 0, expEn: "で marks the means of transport.", expJa: "手段には「で」を使います。" },
        { id: "1g3", type: "grammar", prompt: "きのう ともだち（　）えいがを みました。", options: ["を", "で", "と", "に"], answer: 2, expEn: "と means 'together with' a person.", expJa: "「～と」は一緒にする人を表します。" },
        { id: "1g4", type: "grammar", prompt: "この かさは だれ（　）ですか。", options: ["を", "に", "が", "の"], answer: 3, expEn: "だれの = whose.", expJa: "「だれの」で持ち主を聞きます。" },
        { id: "1g5", type: "grammar", prompt: "きのうは どこ（　）いきませんでした。", options: ["をも", "がも", "でも", "へも"], answer: 3, expEn: "どこへも + negative = nowhere.", expJa: "「どこへも＋否定」で「どこにも～ない」。" }] },
      { jp: "問題2　★に はいる ものは どれですか。", en: "Put the words in order. Which word goes in the ★ slot?", questions: [
        { id: "1s1", type: "star", star: { pre: "わたしは ともだちと", post: "。", order: ["えきの", "まえ", "で", "あいます"], star: 2 }, options: ["あいます", "えきの", "まえ", "で"], answer: 3, expEn: "Correct order: えきの まえ ★で あいます. で marks the place.", expJa: "正しい順：えきの まえ ★で あいます。" },
        { id: "1s2", type: "star", star: { pre: "きのう わたしは", post: "。", order: ["ともだちと", "レストランで", "ひるごはんを", "たべました"], star: 2 }, options: ["たべました", "ともだちと", "ひるごはんを", "レストランで"], answer: 2, expEn: "Correct order: ともだちと レストランで ★ひるごはんを たべました.", expJa: "正しい順：ともだちと レストランで ★ひるごはんを たべました。" }] },
      { jp: "問題3　つぎの ぶんしょうを よんで、しつもんに こたえて ください。", en: "Read the passage and answer the questions.", passage: P1, questions: [
        { id: "1r1", type: "reading", prompt: "わたしは まいにち なんじに かいしゃから かえりますか。", options: ["くじ", "さんじ", "ごじ", "ろくじ"], answer: 2, expEn: "The passage says まいにち ごじに かえります.", expJa: "本文に「ごじにかえります」とあります。" },
        { id: "1r2", type: "reading", prompt: "ほんやは どこに ありますか。", options: ["えきの なか", "いえの まえ", "かいしゃの うしろ", "スーパーの となり"], answer: 3, expEn: "ほんやは スーパーの となり.", expJa: "「スーパーのとなりにほんやがあります」。" }] },
      { jp: "問題4　つぎの おしらせを みて、しつもんに こたえて ください。", en: "Read the notice and answer the question.", passage: INFO1, questions: [
        { id: "1i1", type: "info", prompt: "どようびは なんじまで あいて いますか。", options: ["5:00", "やすみ", "9:00", "12:00"], answer: 3, expEn: "On Saturday the bank is open 9:00 to 12:00.", expJa: "土曜日は9:00〜12:00です。" }] },
    ]},
    { id: 3, title: "Listening", jp: "聴解", minutes: 30, kind: "audio", mondai: [] },
  ]},
  { id: 2, title: "JLPT N5 Mock Test 02", listeningComingSoon: false, parts: [
    { id: 1, title: "Language Knowledge: Vocabulary", jp: "言語知識（文字・語彙）", minutes: 20, mondai: [
      { jp: "問題1　＿＿の ことばは ひらがなで どう かきますか。", en: "Choose the hiragana reading of the underlined kanji.", questions: [
        { id: "2v1", type: "kanji", prompt: "{{毎日}} べんきょうします。", options: ["めいにち", "まいにち", "まいじつ", "めいじつ"], answer: 1, expEn: "毎日 is read まいにち (every day).", expJa: "「毎日」は「まいにち」。" },
        { id: "2v2", type: "kanji", prompt: "{{右}}に ほんが あります。", options: ["ひだり", "うえ", "した", "みぎ"], answer: 3, expEn: "右 is read みぎ (right).", expJa: "「右」は「みぎ」。" }] },
      { jp: "問題2　＿＿の ことばは どう かきますか。", en: "Choose the correct kanji for the underlined hiragana.", questions: [
        { id: "2v3", type: "ortho", prompt: "{{やすい}} ふくを かいます。", options: ["安い", "高い", "新い", "古い"], answer: 0, expEn: "やすい (cheap) is written 安い.", expJa: "「やすい」は「安い」。" },
        { id: "2v4", type: "ortho", prompt: "{{でんわ}}を かけます。", options: ["雷話", "電語", "雷語", "電話"], answer: 3, expEn: "でんわ (telephone) is written 電話.", expJa: "「でんわ」は「電話」。" }] },
      { jp: "問題3　（　）に なにを いれますか。", en: "Choose the best word to fill the blank.", questions: [
        { id: "2v5", type: "context", prompt: "あした しけんが ありますから、（　）を します。", options: ["さんぽ", "かいもの", "べんきょう", "りょこう"], answer: 2, expEn: "Before an exam you study (べんきょう).", expJa: "試験の前は「勉強」をします。" },
        { id: "2v6", type: "context", prompt: "さむいですから、まどを （　）。", options: ["あけます", "ふります", "けします", "しめます"], answer: 3, expEn: "When it is cold you close (しめます) the window.", expJa: "寒いので窓を「閉めます」。" }] },
      { jp: "問題4　＿＿の ぶんと だいたい おなじ いみの ぶんが あります。", en: "Choose the sentence closest in meaning.", questions: [
        { id: "2v7", type: "para", prompt: "この かばんは やすいです。", options: ["この かばんは ふるいです。", "この かばんは たかくないです。", "この かばんは おもいです。", "この かばんは おおきいです。"], answer: 1, expEn: "やすい (cheap) means not expensive.", expJa: "「安い」は「高くない」。" },
        { id: "2v8", type: "para", prompt: "ちちは かいしゃいんです。", options: ["ちちは がっこうで ならっています。", "ちちは びょういんに います。", "ちちは かいしゃで はたらいています。", "ちちは うちで ねています。"], answer: 2, expEn: "A company employee works at a company.", expJa: "会社員は会社で働いています。" }] },
    ]},
    { id: 2, title: "Language Knowledge: Grammar and Reading", jp: "言語知識（文法）・読解", minutes: 40, mondai: [
      { jp: "問題1　（　）に なにを いれますか。", en: "Choose the correct particle.", questions: [
        { id: "2g1", type: "grammar", prompt: "わたしは まいにち しんぶん（　）よみます。", options: ["が", "を", "に", "で"], answer: 1, expEn: "を marks the object.", expJa: "目的語には「を」。" },
        { id: "2g2", type: "grammar", prompt: "あした としょかん（　）いきます。", options: ["で", "を", "へ", "が"], answer: 2, expEn: "へ marks the destination.", expJa: "行き先には「へ」。" },
        { id: "2g3", type: "grammar", prompt: "これは わたし（　）ほんです。", options: ["の", "を", "に", "が"], answer: 0, expEn: "の shows possession.", expJa: "所有は「の」。" },
        { id: "2g4", type: "grammar", prompt: "せんせいは にほんご（　）じょうずです。", options: ["を", "に", "で", "が"], answer: 3, expEn: "じょうず takes が.", expJa: "「上手」の前は「が」。" }] },
      { jp: "問題2　★に はいる ものは どれですか。", en: "Put the words in order. Which word goes in the ★ slot?", questions: [
        { id: "2s1", type: "star", star: { pre: "あした", post: "。", order: ["ともだちと", "でんしゃで", "うみへ", "いきます"], star: 2 }, options: ["いきます", "うみへ", "ともだちと", "でんしゃで"], answer: 1, expEn: "Correct order: ともだちと でんしゃで ★うみへ いきます.", expJa: "正しい順：ともだちと でんしゃで ★うみへ いきます。" }] },
      { jp: "問題3　つぎの ぶんしょうを よんで、しつもんに こたえて ください。", en: "Read the passage and answer the questions.", passage: P2, questions: [
        { id: "2r1", type: "reading", prompt: "わたしは こうえんで なにを しましたか。", options: ["しゃしんを とりました", "ごはんを たべました", "ほんを よみました", "おんがくを ききました"], answer: 2, expEn: "He read a book under the tree.", expJa: "木の下で本を読みました。" },
        { id: "2r2", type: "reading", prompt: "どうして うちへ かえりましたか。", options: ["あめが ふりましたから", "ひるでしたから", "ともだちが きましたから", "つかれましたから"], answer: 0, expEn: "Because it rained.", expJa: "雨が降ったからです。" }] },
      { jp: "問題4　つぎの あんないを みて、しつもんに こたえて ください。", en: "Read the notice and answer the question.", passage: INFO2, questions: [
        { id: "2i1", type: "info", prompt: "げつようびに としょかんは どうですか。", options: ["9:00から あいています", "やすみです", "6:00まで あいています", "ひるだけ あいています"], answer: 1, expEn: "The library is closed on Monday.", expJa: "月曜日は休みです。" }] },
    ]},
    { id: 3, title: "Listening", jp: "聴解", minutes: 30, kind: "audio", mondai: [
      { jp: "問題1　はなしを きいて、しつもんに こたえて ください。", en: "Task-based comprehension: listen and choose the best answer.", questions: [
        { id: "2t1", type: "task", script: [{ v: "f", t: "すみません、トイレは どこですか。" }, { v: "m", t: "あの かいだんを のぼって、ひだりです。" }, { v: "f", t: "ありがとうございます。" }, { v: "n", t: "おんなの ひとは トイレへ いくとき、はじめに なにを しますか。" }], options: ["エレベーターに のります", "かいだんを のぼります", "みぎに まがります", "そとへ でます"], answer: 1, expEn: "He tells her to go up the stairs first.", expJa: "まず階段を上ります。" }] },
      { jp: "問題2　ばめんに あう ことばを えらんで ください。", en: "Verbal expressions: choose what to say in the situation.", questions: [
        { id: "2e1", type: "verbal", situation: "あさ ともだちに あいます。なんと いいますか。", script: [{ v: "n", t: "あさ ともだちに あいます。なんと いいますか。" }, { v: "f", t: "1ばん、こんばんは。" }, { v: "f", t: "2ばん、おはようございます。" }, { v: "f", t: "3ばん、おやすみなさい。" }], options: ["こんばんは。", "おはようございます。", "おやすみなさい。"], answer: 1, expEn: "In the morning you say おはようございます.", expJa: "朝は「おはようございます」。" }] },
      { jp: "問題3　ことばを きいて、ただしい へんじを えらんで ください。", en: "Quick response: listen to the question and choose the best reply.", questions: [
        { id: "2k1", type: "quick", script: [{ v: "m", t: "これは いくらですか。" }, { v: "f", t: "1ばん、さんにんです。2ばん、さんぜんえんです。3ばん、さんじです。" }], options: ["さんにんです。", "さんぜんえんです。", "さんじです。"], answer: 1, expEn: "いくら asks the price, so answer with えん.", expJa: "「いくら」には値段を答えます。" },
        { id: "2k2", type: "quick", script: [{ v: "m", t: "あした なにを しますか。" }, { v: "f", t: "1ばん、きのう しました。2ばん、テニスを します。3ばん、でんしゃです。" }], options: ["きのう しました。", "テニスを します。", "でんしゃです。"], answer: 1, expEn: "あした asks about tomorrow's plan.", expJa: "明日の予定を答えます。" }] },
    ]},
  ]},
];

const FONT = { fontFamily: "'Noto Sans JP','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" };
const CUT = { A: 38, B: 19, T: 80 };
const mmss = (s) => { s = Math.max(0, s); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const qsOf = (part) => part.mondai.flatMap((m) => m.questions);
const Ul = ({ text }) => (<>{text.split(/\{\{(.+?)\}\}/).map((p, i) => (i % 2 ? <u key={i} className="font-bold" style={{ textUnderlineOffset: "6px", textDecorationThickness: "2px" }}>{p}</u> : <span key={i}>{p}</span>))}</>);
const plain = (q) => q.type === "star" ? q.star.pre + " " + q.star.order.map((w, i) => (i === q.star.star ? "★" + w : w)).join(" ") + " " + q.star.post : (q.prompt || q.situation || q.script[0].t).replace(/\{\{|\}\}/g, "");

/* ---------- Listening audio engine (Web Speech API, ja-JP) ---------- */
function AudioBox({ q, strict, used, onPlay }) {
  const [st, setSt] = useState("idle");
  const tok = useRef(0);
  useEffect(() => () => { tok.current++; if (window.speechSynthesis) window.speechSynthesis.cancel(); }, []);
  const play = () => {
    const s = window.speechSynthesis;
    if (!s || (strict && used >= 1)) return;
    onPlay();
    const my = ++tok.current;
    s.cancel();
    const voice = s.getVoices().find((v) => /^ja/i.test(v.lang));
    let i = 0;
    setSt("playing");
    const next = () => {
      if (my !== tok.current) return;
      if (i >= q.script.length) { setSt("done"); return; }
      const l = q.script[i++];
      const u = new SpeechSynthesisUtterance(l.t);
      u.lang = "ja-JP"; if (voice) u.voice = voice; u.rate = 0.9; u.pitch = l.v === "m" ? 0.7 : l.v === "f" ? 1.3 : 1;
      u.onend = () => setTimeout(next, 700); u.onerror = () => setTimeout(next, 0);
      s.speak(u);
    };
    next();
  };
  const toggle = () => { const s = window.speechSynthesis; if (st === "playing") { s.pause(); setSt("paused"); } else if (st === "paused") { s.resume(); setSt("playing"); } };
  const locked = strict && used >= 1 && st !== "playing";
  return (
    <div className="mb-3 rounded-lg bg-slate-900 p-3 text-white">
      <style>{"@keyframes jwave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}"}</style>
      <div className="flex items-center gap-3">
        <button onClick={play} disabled={locked || st === "playing" || st === "paused"} className="flex items-center gap-2 rounded-md bg-indigo-500 px-3 py-1 text-sm font-bold disabled:opacity-40">{locked ? <Lock size={16} /> : <Play size={16} />}{st === "done" && !strict ? "Replay" : locked ? "Played" : "Play"}</button>
        {!strict && (<button onClick={toggle} disabled={st !== "playing" && st !== "paused"} className="flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-sm disabled:opacity-40">{st === "paused" ? <Play size={16} /> : <Pause size={16} />}</button>)}
        <div className="flex h-8 flex-1 items-center gap-1" aria-hidden="true">{Array.from({ length: 24 }).map((_, i) => (<div key={i} className="w-1 flex-1 rounded bg-indigo-300" style={{ height: "100%", transform: "scaleY(.25)", animationName: st === "playing" ? "jwave" : "none", animationDuration: 0.5 + (i % 5) * 0.12 + "s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite", animationDelay: (i % 7) * 0.05 + "s" }} />))}</div>
        <Volume2 size={18} className={st === "playing" ? "text-emerald-300" : "text-slate-400"} />
      </div>
      <p className="mt-1 text-xs text-slate-300">{st === "playing" ? "Playing…" : st === "paused" ? "Paused" : st === "done" ? "Finished." : "Press play."} {strict ? "Plays once only." : "Replay and pause are allowed."}</p>
    </div>
  );
}

export default function JLPTN5MockTest() {
  const [phase, setPhase] = useState("home"); // home | part | coming | result
  const [testId, setTestId] = useState(MOCK_TESTS[0].id);
  const [mode, setMode] = useState("strict");
  const [pIdx, setPIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [spent, setSpent] = useState([0, 0, 0]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [plays, setPlays] = useState({});
  const [tab, setTab] = useState("summary");

  const test = MOCK_TESTS.find((t) => t.id === testId);
  const part = test.parts[pIdx];
  const strict = mode === "strict";

  const openPart = (i) => { setPIdx(i); setTimeLeft(test.parts[i].minutes * 60); setPaused(false); setConfirm(false); setPhase("part"); window.scrollTo(0, 0); };
  const finish = () => { setTab("summary"); setPhase("result"); window.scrollTo(0, 0); };
  const submitPart = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpent((p) => p.map((v, i) => (i === pIdx ? part.minutes * 60 - Math.max(timeLeft, 0) : v)));
    setConfirm(false);
    if (pIdx === 0) openPart(1);
    else if (pIdx === 1) { if (test.listeningComingSoon) { setPhase("coming"); window.scrollTo(0, 0); } else openPart(2); }
    else finish();
  };
  const startExam = () => { setAnswers({}); setSpent([0, 0, 0]); setPlays({}); openPart(0); };

  useEffect(() => { if (phase !== "part" || paused) return; const id = setInterval(() => setTimeLeft((t) => t - 1), 1000); return () => clearInterval(id); }, [phase, paused]);
  useEffect(() => { if (phase === "part" && timeLeft <= 0) submitPart(); }, [timeLeft, phase]);

  const shell = (c) => (<div style={FONT} className="min-h-screen bg-slate-200 text-slate-800"><div className="mx-auto max-w-4xl p-3 md:p-6">{c}</div></div>);

  /* ---------- Home ---------- */
  if (phase === "home") return shell(
    <div className="rounded-2xl bg-white p-6 shadow md:p-10">
      <h1 className="text-3xl font-bold text-indigo-700">JLPT N5 Mock Test <span className="text-slate-400">日本語能力試験 N5</span></h1>
      <p className="mt-2 text-slate-600">Choose a mock test, read the rules, then press Start Exam.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {MOCK_TESTS.map((t) => (<button key={t.id} onClick={() => setTestId(t.id)} className={"rounded-xl border-2 p-4 text-left " + (testId === t.id ? "border-indigo-600 bg-indigo-50" : "border-slate-200")}><div className="flex items-center gap-2 font-bold"><FileText size={18} />{t.title}</div><div className="mt-1 text-sm text-slate-600">{t.listeningComingSoon ? "Vocabulary, Grammar and Reading · 120 marks · Listening coming soon" : "Vocabulary, Grammar, Reading and Listening · 180 marks"}</div></button>))}
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="mb-2 font-bold">Exam rules</div>
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          <li>Part 1 Vocabulary (文字・語彙): 20 minutes. Part 2 Grammar and Reading (文法・読解): 40 minutes. Part 3 Listening (聴解): 30 minutes.</li>
          <li>All questions of a part are on one scrollable paper. Submitting a part, or running out of time, locks it permanently.</li>
          <li>Full test: 180 marks. Pass needs Total ≥ {CUT.T}, Language Knowledge + Reading ≥ {CUT.A} of 120, and Listening ≥ {CUT.B} of 60.</li>
          <li>While listening is "coming soon", the score is out of 120 and the pass mark is {CUT.A}.</li>
        </ul>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[["strict", "Strict Exam Mode", "Timer cannot be paused. Listening audio plays once."], ["practice", "Practice Mode", "You may pause the timer and replay listening audio."]].map(([k, t, d]) => (<button key={k} onClick={() => setMode(k)} className={"rounded-xl border-2 p-3 text-left " + (mode === k ? "border-indigo-600 bg-indigo-50" : "border-slate-200")}><div className="flex items-center gap-2 font-bold">{k === "strict" ? <Lock size={16} /> : <Timer size={16} />}{t}</div><p className="text-sm text-slate-600">{d}</p></button>))}
      </div>
      <button onClick={startExam} className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-lg font-bold text-white hover:bg-indigo-700"><Play size={20} />Start Exam</button>
    </div>
  );

  /* ---------- Listening coming soon ---------- */
  if (phase === "coming") return shell(
    <div className="mx-auto max-w-2xl rounded-md border-2 border-slate-800 bg-white p-10 text-center shadow-lg">
      <Headphones size={48} className="mx-auto text-slate-500" />
      <div className="mt-3 text-sm text-slate-500">Part 3 · 30 minutes</div>
      <h2 className="mt-1 text-2xl font-bold">Listening Section (聴解) — Coming Soon / 準備中</h2>
      <p className="mt-4 text-slate-600">The audio tracks for this mock test are being updated. Your Language Knowledge and Reading results are ready.</p>
      <p className="text-slate-600">この模擬試験の聴解は現在準備中です。</p>
      <button onClick={finish} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white hover:bg-indigo-700"><Send size={20} />Submit Exam & View Full Score</button>
    </div>
  );

  /* ---------- Result ---------- */
  if (phase === "result") {
    const c = test.parts.map((p) => qsOf(p).filter((x) => answers[x.id] === x.answer).length);
    const n = test.parts.map((p) => qsOf(p).length);
    const hasL = !test.listeningComingSoon;
    const A = Math.round(((c[0] + c[1]) / (n[0] + n[1])) * 120), B = hasL ? Math.round((c[2] / n[2]) * 60) : 0, T = A + B, maxT = hasL ? 180 : 120;
    const okA = A >= CUT.A, okB = !hasL || B >= CUT.B, okT = !hasL || T >= CUT.T, pass = okA && okB && okT;
    const Bar = ({ label, val, max, cut, ok }) => (<div className="mb-5"><div className="mb-1 flex justify-between text-sm font-semibold"><span>{label}</span><span className={ok ? "text-emerald-600" : "text-rose-600"}>{val} / {max} (min {cut}) {ok ? "✓" : "✗ below cutoff"}</span></div><div className="relative h-4 rounded-full bg-slate-200"><div className={"h-4 rounded-full " + (ok ? "bg-emerald-500" : "bg-rose-500")} style={{ width: (val / max) * 100 + "%" }} /><div className="absolute -top-1 h-6 w-0.5 bg-slate-800" style={{ left: (cut / max) * 100 + "%" }} /></div></div>);
    return shell(
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 text-sm text-slate-500">{test.title}</div>
        <div className="mb-4 flex gap-2">{["summary", "review"].map((t) => (<button key={t} onClick={() => setTab(t)} className={"rounded-lg px-4 py-2 font-semibold " + (tab === t ? "bg-indigo-600 text-white" : "bg-slate-100")}>{t === "summary" ? "Result" : "Answer Review"}</button>))}</div>
        {tab === "summary" ? (<div>
          <div className={"mb-6 flex items-center gap-4 rounded-xl p-5 " + (pass ? "bg-emerald-50" : "bg-rose-50")}>
            {pass ? <Trophy size={44} className="text-emerald-600" /> : <AlertTriangle size={44} className="text-rose-600" />}
            <div><div className={"text-4xl font-extrabold " + (pass ? "text-emerald-600" : "text-rose-600")}>{pass ? "PASS 合格" : "FAIL 不合格"}</div><div className="text-slate-600">Total score: <b>{T}</b> / {maxT}{hasL ? " (pass mark " + CUT.T + ")" : " · Listening not included yet, so this result is provisional"}</div></div>
          </div>
          {!pass && (<ul className="mb-6 list-disc pl-6 text-rose-700">{!okA && <li>Language Knowledge + Reading: {A} is below the minimum of {CUT.A}.</li>}{!okB && <li>Listening: {B} is below the minimum of {CUT.B}.</li>}{!okT && <li>Total: {T} is below the minimum of {CUT.T}.</li>}</ul>)}
          <Bar label="Section A: Vocabulary, Grammar and Reading" val={A} max={120} cut={CUT.A} ok={okA} />
          {hasL ? <Bar label="Section B: Listening" val={B} max={60} cut={CUT.B} ok={okB} /> : <div className="mb-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Section B: Listening (聴解) — Coming Soon / 準備中</div>}
          {hasL && <Bar label="Total" val={T} max={180} cut={CUT.T} ok={okT} />}
          <h3 className="mb-2 font-bold">Score and time by part</h3>
          <div className="grid gap-2 md:grid-cols-3">{test.parts.map((p, i) => (<div key={p.id} className="rounded-lg border p-3 text-sm"><b>Part {p.id}</b><div className="text-slate-500">{p.title}</div>{i === 2 && !hasL ? <div className="mt-1 text-slate-500">Coming soon</div> : <div className="mt-1 flex items-center gap-1"><Clock size={14} />{mmss(spent[i])} of {mmss(p.minutes * 60)} · {c[i]}/{n[i]} correct</div>}</div>))}</div>
          <button onClick={() => setPhase("home")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white"><RotateCcw size={18} />Back to mock tests</button>
        </div>) : (<div className="space-y-6">
          {test.parts.map((p) => (<div key={p.id}><h3 className="mb-2 border-b-2 border-slate-800 pb-1 text-lg font-bold">Part {p.id}: {p.jp}</h3>{p.mondai.length === 0 && <p className="text-slate-500">Coming soon / 準備中</p>}
            {p.mondai.map((m, mi) => (<div key={mi} className="mb-4"><div className="mb-2 font-bold">{m.jp}</div>{m.passage && <div className="mb-2 whitespace-pre-line rounded bg-slate-50 p-2 text-sm">{m.passage}</div>}
              {m.questions.map((x) => { const a = answers[x.id], ok = a === x.answer; return (<div key={x.id} className="mb-3 rounded-xl border p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">{ok ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}{x.type}</div>
                {x.script && <div className="mb-1 rounded bg-slate-50 p-2 text-sm text-slate-600">{x.script.map((l, i) => (<div key={i}>{l.t}</div>))}</div>}
                <div className="font-semibold">{x.type === "star" ? plain(x) : x.prompt ? <Ul text={x.prompt} /> : x.situation}</div>
                <div className="mt-1 text-sm">Your answer: <b className={ok ? "text-emerald-600" : "text-rose-600"}>{a === undefined ? "Not answered" : x.options[a]}</b></div>
                {!ok && <div className="text-sm">Correct answer: <b className="text-emerald-600">{x.options[x.answer]}</b></div>}
                <div className="mt-2 rounded bg-indigo-50 p-2 text-sm"><div>{x.expEn}</div><div className="text-slate-600">{x.expJa}</div></div></div>); })}</div>))}</div>))}
        </div>)}
      </div>
    );
  }

  /* ---------- Exam paper (all questions on one page) ---------- */
  const all = qsOf(part), answered = all.filter((x) => answers[x.id] !== undefined).length;
  let num = 0;
  return shell(
    <div>
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-md">
        <div className="flex-1"><div className="font-bold">Part {part.id}: {part.title} <span className="text-slate-400">({part.jp})</span></div><div className="text-xs text-slate-500">{test.title} · {strict ? "Strict" : "Practice"} mode</div></div>
        <div className="text-sm font-bold text-indigo-700">{answered} / {all.length} Answered</div>
        <div className={"flex items-center gap-1 text-2xl font-bold " + (timeLeft <= 300 ? "text-rose-600" : "")}><Clock size={20} />{mmss(timeLeft)}</div>
        {!strict && <button onClick={() => setPaused(!paused)} className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold">{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? "Resume" : "Pause"}</button>}
        <button onClick={() => setConfirm(true)} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Submit & Continue</button>
      </div>
      <div className={"mx-auto max-w-3xl rounded-md border border-slate-400 bg-white p-6 shadow-lg md:p-10 " + (paused ? "opacity-30" : "")}>
        <div className="border-b-4 border-double border-slate-800 pb-3 text-center"><div className="text-sm text-slate-500">N5 · {test.title}</div><div className="text-2xl font-bold">{part.jp}</div><div className="text-slate-600">{part.title} · {part.minutes} minutes</div></div>
        {part.mondai.map((m, mi) => (
          <section key={mi} className="mt-8">
            <div className="border-2 border-slate-800 px-3 py-2 text-lg font-bold">{m.jp}</div>
            <p className="mt-1 text-xs text-slate-500">{m.en}</p>
            {m.passage && <div className="mt-3 whitespace-pre-line rounded border border-slate-300 bg-slate-50 p-4 text-lg leading-8">{m.passage}</div>}
            {m.questions.map((q) => {
              num += 1;
              return (
                <div key={q.id} className="mt-6 flex gap-3">
                  <div className="w-8 flex-none text-lg font-bold">{num}</div>
                  <div className="flex-1">
                    {part.kind === "audio" && <AudioBox q={q} strict={strict} used={plays[q.id] || 0} onPlay={() => setPlays((p) => ({ ...p, [q.id]: (p[q.id] || 0) + 1 }))} />}
                    {q.type === "star" ? (<div className="mb-3 text-xl leading-10">{q.star.pre} {q.star.order.map((_, i) => (<span key={i} style={{ minWidth: "3rem" }} className={"mx-1 inline-block border-b-2 px-2 text-center " + (i === q.star.star ? "border-amber-500 font-bold text-amber-600" : "border-slate-400 text-transparent")}>{i === q.star.star ? "★" : "＿"}</span>))} {q.star.post}</div>)
                      : q.prompt ? <div className="mb-3 text-xl leading-9"><Ul text={q.prompt} /></div> : <div className="mb-3 text-lg">{strict ? "Listen carefully and choose the best answer." : q.situation}</div>}
                    <div className="grid gap-2 md:grid-cols-2">
                      {q.options.map((o, i) => (<button key={i} onClick={() => setAnswers({ ...answers, [q.id]: i })} className={"flex items-center gap-2 rounded border-2 px-3 py-2 text-left text-lg " + (answers[q.id] === i ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-300")}><span className={"flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold " + (answers[q.id] === i ? "bg-indigo-600 text-white" : "bg-slate-200")}>{i + 1}</span>{part.kind === "audio" && (q.type === "verbal" || q.type === "quick") && strict ? <span className="text-slate-500">Option {i + 1}</span> : o}</button>))}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
        <div className="mt-10 text-center"><button onClick={() => setConfirm(true)} className="rounded-xl bg-indigo-600 px-10 py-4 text-xl font-bold text-white hover:bg-indigo-700">Submit Part {part.id}</button><p className="mt-2 text-xs text-slate-500">Once submitted, this part is locked permanently.</p></div>
      </div>
      {confirm && (<div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4"><div className="max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-xl font-bold">Submit Part {part.id}?</h3><p className="mt-2 text-slate-600">{all.length - answered > 0 ? all.length - answered + " question(s) are unanswered. " : "All questions are answered. "}Once submitted, this part is locked permanently and you cannot return to it.</p><div className="mt-5 flex justify-end gap-3"><button onClick={() => setConfirm(false)} className="rounded-lg bg-slate-200 px-4 py-2 font-semibold">Keep working</button><button onClick={submitPart} className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Submit and lock</button></div></div></div>)}
    </div>
  );
}
