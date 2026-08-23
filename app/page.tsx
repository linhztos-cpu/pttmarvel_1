"use client";

import { useEffect, useRef, useState } from "react";

type PushTone = "推" | "噓" | "→";

type Push = {
  tone: PushTone;
  author: string;
  text: string;
  time: string;
};

type Reply = {
  author: string;
  text: string;
  time: string;
};

type Post = {
  id: string;
  score: string;
  scoreTone: "hot" | "warm" | "normal" | "quiet";
  category: string;
  title: string;
  author: string;
  listAuthor?: string;
  date: string;
  articleTime?: string;
  body?: string;
};

type SortOrder = "default" | "oldest" | "newest";
type PageNumber = 1 | 2;
type DialogMode = "post" | "reply" | "push" | "help" | null;
type ArchiveSection = "考古區" | "新聞區" | null;

const LOGIN_STORY = `我哥很喜歡飛機，小時候他常說，他夢想當一個飛行員，也常常在網路上發有關他研究飛機的文章和看法。有天晚上他打電話給我，興致勃勃的跟我說，他想要去一個地方，親眼看看飛機曾經的位置，就算飛機已經不在了。
長大後其實我們沒有很熟，後來我也就沒再接到他的電話。但一個月過去了，媽生日那天我們也聯絡不上他，這實在很不尋常，不管多忙他那天一定會買一束花回來的

然後我找到了他在網路上的文章，我以前都找不到。原來他的匿名就是飛行員.......`;

type SiteHistoryState =
  | { marvel: true; view: "login" }
  | { marvel: true; view: "board"; page: PageNumber; scrollY?: number }
  | { marvel: true; view: "article"; page: PageNumber; postId: string }
  | { marvel: true; view: "archive"; page: PageNumber }
  | { marvel: true; view: "archive-archaeology"; page: PageNumber }
  | { marvel: true; view: "archive-news"; page: PageNumber }
  | { marvel: true; view: "contact"; page: PageNumber };

const posts: Post[] = [
  {
    id: "p1-flattendghiant",
    score: "爆",
    scoreTone: "hot",
    category: "經驗",
    title: "桃園探險日記",
    author: "flattendghiant  （飛機探險家）",
    listAuthor: "flattendghiant",
    date: "4/16",
    articleTime: "Thu  Apr  16 20:04:13 1998",
    body: `新聞爆出來的時候是兩個月前，剛好也就是我的生日，所以我印象很深。後來有很多媒體都說，有人在深夜的台15線上，都會看到有人很茫然的蹲著或站在那邊。
我從小就不信神鬼傳說，不過還是十分好奇那裡到底怎麼了，為什麼會有這麼多的謠言。我打電話給我弟，跟他說我是要去看飛機殘骸，他知道我喜歡飛機，就沒有多問什麼。
一個人要去探險！祝我順利，回來再繼續更新`,
  },
  { id: "p1-cloudywindy", score: "23", scoreTone: "warm", category: "閒聊", title: "", author: "cloudywindy", date: "2/15" },
  {
    id: "p1-moooonghost",
    score: "8",
    scoreTone: "normal",
    category: "見聞",
    title: "還是以後都不吃烤肉",
    author: "moooonghost",
    date: "2/17",
    articleTime: "Tue Feb 17 19:05:14 1998",
    body: "計程車在報案的時候就被飛機掃過，4個人就離開了。我們救災到最後，才確認車內4人都已罹難。那個飛機頭有一部分撞到民宅，正確的數字沒辦法確定。現場有一股濃烈的氣味，那時候有些人看到便當都吃不下去，我沒有時間考慮這麼多啦，我肚子餓就吃了。這種的我看過的已經太多了。",
  },
  { id: "p1-oldmenga", score: "12", scoreTone: "warm", category: "問卦", title: "", author: "oldmenga", date: "3/10" },
  { id: "p1-owlight", score: "4", scoreTone: "normal", category: "創作", title: "", author: "owlight", date: "5/25" },
  { id: "p1-plairane", score: "18", scoreTone: "warm", category: "經驗", title: "", author: "plairane", date: "2/16" },
  { id: "p1-supeerstii", score: "6", scoreTone: "normal", category: "經驗", title: "", author: "supeerstii", date: "5/26" },
  { id: "p1-kingdorgan", score: "31", scoreTone: "warm", category: "創作", title: "", author: "kingdorgan", date: "7/23" },
  {
    id: "p1-stargazer",
    score: "5",
    scoreTone: "normal",
    category: "閒聊",
    title: "",
    author: "stargazer",
    date: "2/4",
    body: "我昨天夢到一個人，身穿黃色衣服，頭上帶著一個串珠連成的帽子，然後拿著一個托盤跟我說，叫我要幫他完成一件事，不然我就得永遠醒不來。",
  },
  { id: "p1-craftair", score: "", scoreTone: "quiet", category: "見聞", title: "", author: "craftair", date: "2/19" },
];

const pageTwoPosts: Post[] = posts.map((post) => ({ ...post, id: post.id.replace("p1-", "p2-") }));

function dateValue(date: string) {
  const [month, day] = date.split("/").map(Number);
  return month * 100 + day;
}

function todayDate() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

function currentTime() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${month}/${day} ${time}`;
}

function normalizeResponseTime(time: string) {
  const value = time.trim();
  return /^\d{1,2}:\d{2}$/.test(value) ? `08/13 ${value.padStart(5, "0")}` : value;
}

function isRemovedReplyPost(post: Post) {
  const normalizedTitle = post.title.replace(/\s/g, "").replace("：", ":").toLocaleLowerCase("zh-TW");
  return post.category === "見聞"
    && post.author.trim().toLocaleLowerCase("zh-TW") === "guest"
    && post.date === "8/13"
    && normalizedTitle === "re:還是以後都不吃烤肉";
}

function NavButton({
  children,
  muted = false,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = `nav-button${muted ? " nav-button--muted" : ""}${onClick ? " nav-button--interactive" : ""}${active ? " nav-button--active" : ""}`;

  if (onClick) {
    return <button className={className} type="button" onClick={onClick} aria-pressed={active}>{children}</button>;
  }

  return <span className={className}>{children}</span>;
}

function Topbar({ archive = false, onContact }: { archive?: boolean; onContact: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brandline">
          <span className="brand">批踢踢實業坊</span>
          <span className="chevron" aria-hidden="true">›</span>
          <span className="board-label">{archive ? <>精華區<sup>beta</sup> <strong>marvel</strong></> : <>看板 <strong>marvel</strong></>}</span>
        </div>
        <div className="utility" aria-label="網站資訊"><button type="button" onClick={onContact}>聯絡我們</button><span>關於我們</span></div>
      </div>
    </header>
  );
}

const archiveSections = ["版規", "經驗區", "考古區", "新聞區", "創作區"];

const archiveNews = [
  {
    source: "今周刊",
    title: "大園空難事件》CI676墜毀前三十分鐘 通話紀錄全程曝光",
    href: "https://www.businesstoday.com.tw/article/category/183027/post/202601220025/",
  },
  {
    source: "華視新聞",
    title: "【歷史上的今天-0216】華航大園空難 台灣航空悲劇",
    href: "https://www.facebook.com/share/v/1cUP47kGQ3/",
  },
  {
    source: "華視新聞",
    title: "【歷史上的今天】1998.02.16_華航空難經過",
    href: "https://www.youtube.com/watch?v=qVvUpJq_8s0",
  },
  {
    source: "大愛電視台",
    title: "歷史的今天",
    href: "https://youtu.be/XlXCl9xcMPU?si=tbkUImI3PIDfgBBj",
  },
];

function ArchivePage({
  openSection,
  onBack,
  onBackToIndex,
  onOpenSection,
  onContact,
}: {
  openSection: ArchiveSection;
  onBack: () => void;
  onBackToIndex: () => void;
  onOpenSection: (section: ArchiveSection) => void;
  onContact: () => void;
}) {
  if (openSection === "新聞區") {
    return (
      <main className="site-shell archive-shell">
        <Topbar archive onContact={onContact} />
        <section className="archive-board archive-feature" aria-labelledby="news-title">
          <nav className="archive-toolbar" aria-label="精華區導覽">
            <button type="button" onClick={onBack}>看板</button>
            <button type="button" onClick={onBackToIndex}>精華區</button>
            <span aria-current="page">新聞區</span>
          </nav>
          <div className="archive-feature__content archive-news">
            <h1 id="news-title">【新聞區】</h1>
            <ul>
              {archiveNews.map((item) => (
                <li key={item.href}>
                  <span className="archive-news__diamond" aria-hidden="true">◆</span>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    <span className="archive-news__source">{item.source}：</span>{item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <button className="archive-back" type="button" onClick={onBackToIndex}>回到上層</button>
      </main>
    );
  }

  if (openSection === "考古區") {
    return (
      <main className="site-shell archive-shell">
        <Topbar archive onContact={onContact} />
        <section className="archive-board archive-feature" aria-labelledby="archaeology-title">
          <nav className="archive-toolbar" aria-label="精華區導覽">
            <button type="button" onClick={onBack}>看板</button>
            <button type="button" onClick={onBackToIndex}>精華區</button>
            <span aria-current="page">考古區</span>
          </nav>
          <div className="archive-feature__content">
            <h1 id="archaeology-title">【考古區】</h1>
            <figure className="archive-map">
              <img
                src="/bali-taiwan-route-16x9.png"
                alt="從印尼峇里島伍拉·賴國際機場飛往台灣桃園國際機場的航線圖"
              />
            </figure>
          </div>
        </section>
        <button className="archive-back" type="button" onClick={onBackToIndex}>回到上層</button>
      </main>
    );
  }

  return (
    <main className="site-shell archive-shell">
      <Topbar archive onContact={onContact} />
      <section className="archive-board" aria-label="Marvel 精華區目錄索引">
        <nav className="archive-toolbar" aria-label="看板導覽">
          <button type="button" onClick={onBack}>看板</button>
          <span aria-current="page">精華區</span>
        </nav>
        <div className="archive-index">
          <h1>◎ 精華區目錄索引 <span>(5701.6k)</span></h1>
          <div className="archive-rule" aria-hidden="true">◇ ★━━━━━━━━━━━━━━━━━━┐</div>
          <ul>
            {archiveSections.map((section) => (
              <li key={section}>
                <span className="archive-diamond">◆</span>
                <span className="archive-branch">│</span>
                {section === "考古區" || section === "新聞區" ? (
                  <button className="archive-folder archive-folder--button" type="button" onClick={() => onOpenSection(section as ArchiveSection)}>【{section}】</button>
                ) : (
                  <span className="archive-folder">【{section}】</span>
                )}
              </li>
            ))}
          </ul>
          <div className="archive-rule archive-rule--bottom" aria-hidden="true">◇ ★━━━━━━━━━━━━━━━━━━┘</div>
        </div>
      </section>
      <button className="archive-back" type="button" onClick={onBack}>回到上層</button>
    </main>
  );
}

function ContactPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="site-shell contact-shell">
      <Topbar onContact={() => undefined} />
      <section className="contact-page" aria-labelledby="contact-title">
        <div className="contact-card">
          <h1 id="contact-title">聯絡我們</h1>
          <div className="contact-divider" aria-hidden="true">────────────────────────</div>
          <p>各機關來函，請透過電子信箱。</p>
          <p>其他使用問題，請聯繫批踢踢粉絲團。</p>
          <p>批踢踢人員皆為學生，處理速度較為緩慢，敬請見諒。</p>
        </div>
      </section>
      <button className="archive-back" type="button" onClick={onBack}>回到上層</button>
    </main>
  );
}

function LoginCover({ value, onChange, onEnter }: { value: string; onChange: (value: string) => void; onEnter: () => void }) {
  return (
    <main className="login-cover">
      <form className="login-box" onSubmit={(event) => { event.preventDefault(); onEnter(); }}>
        <div className="login-heading">批踢踢實業坊</div>
        <label htmlFor="login-code">請輸入您的代號</label>
        <div className="login-field">
          <span aria-hidden="true">代號</span>
          <input
            id="login-code"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={20}
            autoComplete="off"
            autoFocus
            aria-describedby="login-hint"
          />
        </div>
        <p id="login-hint">輸入自創代號後，按 Enter 進入 marvel 看板</p>
      </form>
    </main>
  );
}

function Dialog({
  mode,
  author,
  category,
  title,
  body,
  pushTone,
  pushText,
  onAuthor,
  onCategory,
  onTitle,
  onBody,
  onPushTone,
  onPushText,
  onSubmit,
  onClose,
}: {
  mode: Exclude<DialogMode, null>;
  author: string;
  category: string;
  title: string;
  body: string;
  pushTone: PushTone;
  pushText: string;
  onAuthor: (value: string) => void;
  onCategory: (value: string) => void;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onPushTone: (value: PushTone) => void;
  onPushText: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (mode === "help") {
    return (
      <div className="bbs-dialog" role="dialog" aria-modal="true" aria-label="PTT 按鍵說明">
        <div className="bbs-dialog__panel bbs-dialog__panel--help">
          <h2>〖 PTT 常用按鍵說明 〗</h2>
          <p><kbd>←</kbd>／<kbd>→</kbd>　離開文章，回到原本列表頁</p>
          <p><kbd>Ctrl</kbd>＋<kbd>P</kbd>　在看板發表文章</p>
          <p><kbd>y</kbd>　回覆目前文章至看板</p>
          <p><kbd>X</kbd>／<kbd>%</kbd>　推文、噓文或加註</p>
          <p><kbd>Ctrl</kbd>＋<kbd>X</kbd>　送出發文或回文</p>
          <p><kbd>Esc</kbd>　取消目前操作</p>
          <button type="button" onClick={onClose}>按 Esc 或點此關閉</button>
        </div>
      </div>
    );
  }

  if (mode === "push") {
    return (
      <div className="bbs-dialog" role="dialog" aria-modal="true" aria-label="推薦文章">
        <div className="bbs-dialog__panel">
          <h2>推薦文章　(X／%)</h2>
          <label>使用者 <input value={author} readOnly aria-readonly="true" autoFocus /></label>
          <fieldset>
            <legend>請選擇</legend>
            {(["推", "噓", "→"] as PushTone[]).map((tone, index) => (
              <button className={pushTone === tone ? "is-selected" : ""} key={tone} type="button" onClick={() => onPushTone(tone)}>{index + 1}. {tone === "推" ? "值得推薦" : tone === "噓" ? "給它噓聲" : "只加註解"}</button>
            ))}
          </fieldset>
          <label>內容 <input value={pushText} maxLength={80} onChange={(event) => onPushText(event.target.value)} /></label>
          <div className="bbs-dialog__actions"><button type="button" onClick={onSubmit}>Enter 送出</button><button type="button" onClick={onClose}>Esc 取消</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bbs-dialog" role="dialog" aria-modal="true" aria-label={mode === "post" ? "發表文章" : "回覆文章"}>
      <div className="bbs-dialog__panel bbs-dialog__panel--editor">
        <h2>{mode === "post" ? "發表文章　(^P)" : "回覆文章　(y)"}</h2>
        <div className="bbs-dialog__fields">
          <label>作者 <input value={author} readOnly aria-readonly="true" /></label>
          <label>分類 <input value={category} onChange={(event) => onCategory(event.target.value)} /></label>
          <label>標題 <input value={title} onChange={(event) => onTitle(event.target.value)} /></label>
        </div>
        <textarea value={body} onChange={(event) => onBody(event.target.value)} autoFocus placeholder="請輸入文章內容⋯" />
        <div className="bbs-dialog__actions"><button type="button" onClick={onSubmit}>Ctrl+X 發表</button><button type="button" onClick={onClose}>Esc 取消</button></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [openedPost, setOpenedPost] = useState<Post | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveSection, setArchiveSection] = useState<ArchiveSection>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [currentPage, setCurrentPage] = useState<PageNumber>(1);
  const [customPosts, setCustomPosts] = useState<Record<PageNumber, Post[]>>({ 1: [], 2: [] });
  const [pushes, setPushes] = useState<Record<string, Push[]>>({});
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [formAuthor, setFormAuthor] = useState("guest");
  const [formCategory, setFormCategory] = useState("閒聊");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [pushTone, setPushTone] = useState<PushTone>("推");
  const [pushText, setPushText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginStory, setShowLoginStory] = useState(false);
  const [typedLoginStory, setTypedLoginStory] = useState("");
  const [loginStoryComplete, setLoginStoryComplete] = useState(false);
  const listScrollY = useRef(0);
  const customPostsRef = useRef(customPosts);

  useEffect(() => {
    customPostsRef.current = customPosts;
  }, [customPosts]);

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem("marvel-custom-posts");
      const savedPushes = localStorage.getItem("marvel-pushes");
      const savedReplies = localStorage.getItem("marvel-replies");
      const savedCode = localStorage.getItem("marvel-user-code");
      if (savedCode) setLoginCode(savedCode);
      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts) as Record<PageNumber, Post[]>;
        const cleanedPosts = {
          1: (parsedPosts[1] ?? []).filter((post) => post.body?.trim() !== "真的假的" && !isRemovedReplyPost(post)),
          2: (parsedPosts[2] ?? []).filter((post) => post.body?.trim() !== "真的假的" && !isRemovedReplyPost(post)),
        };
        setCustomPosts(cleanedPosts);
        localStorage.setItem("marvel-custom-posts", JSON.stringify(cleanedPosts));
      }
      if (savedPushes) {
        const parsedPushes = JSON.parse(savedPushes) as Record<string, Push[]>;
        const cleanedPushes = Object.fromEntries(Object.entries(parsedPushes).map(([key, rows]) => [key, rows
          .filter((row) => row.author !== "caaaaaara")
          .map((row) => ({ ...row, time: normalizeResponseTime(row.time) }))]));
        setPushes(cleanedPushes);
        localStorage.setItem("marvel-pushes", JSON.stringify(cleanedPushes));
      }
      if (savedReplies) {
        const parsedReplies = JSON.parse(savedReplies) as Record<string, Reply[]>;
        const cleanedReplies = Object.fromEntries(Object.entries(parsedReplies).map(([key, rows]) => [key, rows
          .filter((row) => row.author !== "caaaaaara")
          .map((row) => ({ ...row, time: normalizeResponseTime(row.time) }))]));
        setReplies(cleanedReplies);
        localStorage.setItem("marvel-replies", JSON.stringify(cleanedReplies));
      }
    } catch {
      // Ignore malformed device-local demo data.
    }
  }, []);

  const basePosts = currentPage === 1 ? posts : pageTwoPosts;
  const currentPosts = [...customPosts[currentPage], ...basePosts];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("zh-TW");
  const searchedPosts = normalizedQuery
    ? currentPosts.filter((post) => [post.category, post.title, post.author, post.date, post.articleTime, post.body]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("zh-TW")
        .includes(normalizedQuery))
    : currentPosts;
  const displayedPosts = sortOrder === "default"
    ? searchedPosts
    : [...searchedPosts].sort((a, b) => {
        const difference = dateValue(a.date) - dateValue(b.date);
        return sortOrder === "oldest" ? difference : -difference;
      });

  function persistPosts(next: Record<PageNumber, Post[]>) {
    setCustomPosts(next);
    localStorage.setItem("marvel-custom-posts", JSON.stringify(next));
  }

  function persistPushes(next: Record<string, Push[]>) {
    setPushes(next);
    localStorage.setItem("marvel-pushes", JSON.stringify(next));
  }

  function persistReplies(next: Record<string, Reply[]>) {
    setReplies(next);
    localStorage.setItem("marvel-replies", JSON.stringify(next));
  }

  function findPost(postId: string, page: PageNumber) {
    const base = page === 1 ? posts : pageTwoPosts;
    return [...customPostsRef.current[page], ...base].find((post) => post.id === postId) ?? null;
  }

  function applyHistoryState(state: SiteHistoryState) {
    setDialogMode(null);
    setOpenedPost(null);
    setArchiveOpen(false);
    setArchiveSection(null);
    setContactOpen(false);

    if (state.view === "login") {
      setIsLoggedIn(false);
      window.scrollTo(0, 0);
      return;
    }

    setIsLoggedIn(true);
    setCurrentPage(state.page);

    if (state.view === "article") {
      const post = findPost(state.postId, state.page);
      if (post) setOpenedPost(post);
      window.scrollTo(0, 0);
      return;
    }

    if (state.view === "archive" || state.view === "archive-archaeology" || state.view === "archive-news") {
      setArchiveOpen(true);
      setArchiveSection(state.view === "archive-archaeology" ? "考古區" : state.view === "archive-news" ? "新聞區" : null);
      window.scrollTo(0, 0);
      return;
    }

    if (state.view === "contact") {
      setContactOpen(true);
      window.scrollTo(0, 0);
      return;
    }

    setSortOrder("default");
    requestAnimationFrame(() => window.scrollTo(0, state.scrollY ?? listScrollY.current));
  }

  function pushHistoryState(state: SiteHistoryState) {
    window.history.pushState(state, "");
    applyHistoryState(state);
  }

  function returnToPreviousView() {
    const state = window.history.state as SiteHistoryState | null;
    if (state?.marvel && state.view !== "login") {
      window.history.back();
      return;
    }
    const fallback: SiteHistoryState = { marvel: true, view: "board", page: currentPage, scrollY: listScrollY.current };
    window.history.replaceState(fallback, "");
    applyHistoryState(fallback);
  }

  function openArchive() {
    const boardState = window.history.state as SiteHistoryState | null;
    if (boardState?.marvel && boardState.view === "board") {
      window.history.replaceState({ ...boardState, scrollY: window.scrollY }, "");
    }
    pushHistoryState({ marvel: true, view: "archive", page: currentPage });
  }

  function openArchiveSection(section: ArchiveSection) {
    if (section === "考古區") {
      pushHistoryState({ marvel: true, view: "archive-archaeology", page: currentPage });
    } else if (section === "新聞區") {
      pushHistoryState({ marvel: true, view: "archive-news", page: currentPage });
    }
  }

  function openContactPage() {
    const boardState = window.history.state as SiteHistoryState | null;
    if (boardState?.marvel && boardState.view === "board") {
      window.history.replaceState({ ...boardState, scrollY: window.scrollY }, "");
    }
    pushHistoryState({ marvel: true, view: "contact", page: currentPage });
  }

  function goToPage(page: PageNumber) {
    pushHistoryState({ marvel: true, view: "board", page, scrollY: 0 });
  }

  function openArticle(post: Post) {
    listScrollY.current = window.scrollY;
    const boardState = window.history.state as SiteHistoryState | null;
    if (boardState?.marvel && boardState.view === "board") {
      window.history.replaceState({ ...boardState, scrollY: listScrollY.current }, "");
    }
    pushHistoryState({ marvel: true, view: "article", page: currentPage, postId: post.id });
  }

  function closeArticle() {
    returnToPreviousView();
  }

  function openEditor(mode: "post" | "reply") {
    setFormAuthor(loginCode);
    setFormCategory(mode === "reply" && openedPost ? openedPost.category : "閒聊");
    setFormTitle(mode === "reply" && openedPost ? `Re: ${openedPost.title || `[${openedPost.category}]`}` : "");
    setFormBody("");
    setDialogMode(mode);
  }

  function openPush() {
    setFormAuthor(loginCode);
    setPushTone("推");
    setPushText("");
    setDialogMode("push");
  }

  function enterBoard() {
    const code = loginCode.trim();
    if (!code) return;
    setLoginCode(code);
    setFormAuthor(code);
    setTypedLoginStory("");
    setLoginStoryComplete(false);
    setShowLoginStory(true);
    localStorage.setItem("marvel-user-code", code);
    pushHistoryState({ marvel: true, view: "board", page: 1, scrollY: 0 });
  }

  useEffect(() => {
    if (!showLoginStory || loginStoryComplete) return;

    let characterCount = 0;
    const typingTimer = window.setInterval(() => {
      characterCount += 1;
      setTypedLoginStory(LOGIN_STORY.slice(0, characterCount));
      if (characterCount >= LOGIN_STORY.length) {
        window.clearInterval(typingTimer);
        setLoginStoryComplete(true);
      }
    }, 100);

    return () => window.clearInterval(typingTimer);
  }, [showLoginStory, loginStoryComplete]);

  function continueFromLoginStory() {
    if (loginStoryComplete) setShowLoginStory(false);
  }

  function submitEditor() {
    if (!formAuthor.trim() || !formBody.trim()) return;
    if (dialogMode === "reply" && openedPost) {
      const next = {
        ...replies,
        [openedPost.id]: [...(replies[openedPost.id] ?? []), { author: formAuthor.trim(), text: formBody.trim(), time: currentTime() }],
      };
      persistReplies(next);
      setFormBody("");
      setDialogMode(null);
      return;
    }
    const page = currentPage;
    const newPost: Post = {
      id: `custom-${page}-${Date.now()}`,
      score: "",
      scoreTone: "quiet",
      category: formCategory.trim() || "閒聊",
      title: formTitle.trim(),
      author: formAuthor.trim(),
      date: todayDate(),
      articleTime: new Date().toString(),
      body: formBody.trim(),
    };
    persistPosts({ ...customPosts, [page]: [newPost, ...customPosts[page]] });
    setDialogMode(null);
  }

  function submitPush() {
    if (!openedPost || !formAuthor.trim() || !pushText.trim()) return;
    const next = {
      ...pushes,
      [openedPost.id]: [...(pushes[openedPost.id] ?? []), { tone: pushTone, author: formAuthor.trim(), text: pushText.trim(), time: currentTime() }],
    };
    persistPushes(next);
    setPushText("");
    setDialogMode(null);
  }

  useEffect(() => {
    const initialState = window.history.state as SiteHistoryState | null;
    if (initialState?.marvel) {
      applyHistoryState(initialState);
    } else {
      window.history.replaceState({ marvel: true, view: "login" } satisfies SiteHistoryState, "");
    }

    function handlePopState(event: PopStateEvent) {
      const state = event.state as SiteHistoryState | null;
      if (state?.marvel) applyHistoryState(state);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (showLoginStory) {
        if (event.key === " " || event.key === "Enter" || event.key === "Escape" || (event.ctrlKey && event.key.toLowerCase() === "x")) {
          event.preventDefault();
          if (loginStoryComplete) continueFromLoginStory();
        }
        return;
      }

      if (dialogMode) {
        if (event.key === "Escape") {
          event.preventDefault();
          setDialogMode(null);
        } else if (event.ctrlKey && event.key.toLowerCase() === "x") {
          event.preventDefault();
          if (dialogMode === "post" || dialogMode === "reply") submitEditor();
          if (dialogMode === "push") submitPush();
        }
        return;
      }

      if (contactOpen) {
        if (event.key === "ArrowLeft" || event.key === "Escape") {
          event.preventDefault();
          returnToPreviousView();
        }
      } else if (archiveOpen) {
        if (event.key === "ArrowLeft" || event.key === "Escape") {
          event.preventDefault();
          returnToPreviousView();
        }
      } else if (openedPost) {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          closeArticle();
        } else if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          openEditor("reply");
        } else if (event.key === "X" || event.key === "%") {
          event.preventDefault();
          openPush();
        } else if (event.key.toLowerCase() === "h") {
          event.preventDefault();
          setDialogMode("help");
        }
      } else if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        openEditor("post");
      } else if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        setDialogMode("help");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const dialog = dialogMode ? (
    <Dialog
      mode={dialogMode}
      author={formAuthor}
      category={formCategory}
      title={formTitle}
      body={formBody}
      pushTone={pushTone}
      pushText={pushText}
      onAuthor={setFormAuthor}
      onCategory={setFormCategory}
      onTitle={setFormTitle}
      onBody={setFormBody}
      onPushTone={setPushTone}
      onPushText={setPushText}
      onSubmit={dialogMode === "push" ? submitPush : submitEditor}
      onClose={() => setDialogMode(null)}
    />
  ) : null;

  const storyOverlay = showLoginStory ? (
    <section className="login-story" role="dialog" aria-modal="true" aria-label="發表文章內文">
      <div className="login-story__panel">
        <header>發表文章　(^P)</header>
        <div className="login-story__fields" aria-label="發文資訊">
          <label><span>作者</span><input value="supeerstii" readOnly aria-readonly="true" /></label>
          <label><span>分類</span><input value="問卦" readOnly aria-readonly="true" /></label>
          <label><span>標題</span><input value="我哥怎麼了" readOnly aria-readonly="true" /></label>
        </div>
        <div className="login-story__body" role="textbox" aria-readonly="true" aria-label="文章內文">
          <span>{typedLoginStory}</span>
          <span className="login-story__cursor" aria-hidden="true">▌</span>
        </div>
        <footer className="login-story__status">
          <span className="login-story__page">編輯　第 1/1 頁（100%）</span>
          <div className="login-story__commands">
            <button type="button" onClick={continueFromLoginStory} disabled={!loginStoryComplete}>進到看板</button>
          </div>
        </footer>
      </div>
    </section>
  ) : null;

  if (!isLoggedIn) {
    return <LoginCover value={loginCode} onChange={setLoginCode} onEnter={enterBoard} />;
  }

  if (contactOpen) {
    return <ContactPage onBack={returnToPreviousView} />;
  }

  if (archiveOpen) {
    return (
      <ArchivePage
        openSection={archiveSection}
        onBack={returnToPreviousView}
        onBackToIndex={returnToPreviousView}
        onOpenSection={openArchiveSection}
        onContact={openContactPage}
      />
    );
  }

  if (openedPost) {
    return (
      <main className="terminal-shell">
        <section className="terminal-frame" aria-label="文章內容">
          <article className="article-page">
            <header className="article-meta">
              <div className="article-meta__row"><span className="article-meta__label">作者</span><span className="article-meta__value">{openedPost.author}</span></div>
              <div className="article-meta__row"><span className="article-meta__label">標題</span><span className="article-meta__value">[{openedPost.category}]{openedPost.title ? ` ${openedPost.title}` : ""}</span></div>
              <div className="article-meta__row"><span className="article-meta__label">時間</span><span className="article-meta__value">{openedPost.articleTime ?? openedPost.date}</span></div>
              <div className="article-meta__board"><span className="article-meta__label">看板</span><span className="article-meta__value">marvel</span></div>
            </header>
            <div className="article-divider" />
            <div className="article-body">
              <p>{openedPost.body}</p>
              <p className="article-origin">※ 發信站: 批踢踢實業坊(ptt.cc)</p>
              {(replies[openedPost.id] ?? []).length > 0 && (
                <div className="article-replies" aria-label="回覆文章">
                  {(replies[openedPost.id] ?? []).map((reply, index) => (
                    <p key={`${reply.time}-${index}`}><span className="reply-mark">推</span> <strong>{reply.author}</strong><span>: {reply.text}</span><time>{reply.time}</time></p>
                  ))}
                </div>
              )}
              {(pushes[openedPost.id] ?? []).length > 0 && (
                <div className="article-pushes" aria-label="推文列表">
                  {(pushes[openedPost.id] ?? []).map((push, index) => (
                    <p key={`${push.time}-${index}`}><span className={`push-tone push-tone--${push.tone === "推" ? "up" : push.tone === "噓" ? "down" : "note"}`}>{push.tone}</span> <strong>{push.author}</strong>: {push.text} <time>{push.time}</time></p>
                  ))}
                </div>
              )}
            </div>
          </article>
          <footer className="terminal-status" aria-label="文章瀏覽狀態">
            <span className="terminal-status__page">瀏覽　第 1/1 頁（100%）</span>
            <div className="terminal-status__commands">
              <span className="terminal-status__muted">目前顯示：第 01~09 行　</span>
              <button type="button" onClick={() => openEditor("reply")}><em>(y)</em>回應</button>
              <button type="button" onClick={openPush}><em>(X%)</em>推文</button>
              <button type="button" onClick={() => setDialogMode("help")}><em>(h)</em>說明</button>
              <button type="button" onClick={closeArticle}><em>(←/→)</em>離開</button>
            </div>
          </footer>
        </section>
        {dialog}
        {storyOverlay}
      </main>
    );
  }

  return (
    <main className="site-shell">
      <Topbar onContact={openContactPage} />
      <section className="board" aria-label={`Marvel 文章列表，第 ${currentPage} 頁`}>
        <nav className="toolbar" aria-label="看板導覽">
          <div className="toolbar__tabs"><NavButton>看板</NavButton><NavButton onClick={openArchive}>精華區</NavButton></div>
          <div className="toolbar__pages">
            <NavButton onClick={() => setSortOrder("oldest")} active={sortOrder === "oldest"}>最舊</NavButton>
            <NavButton muted={currentPage === 1} onClick={currentPage === 2 ? () => goToPage(1) : undefined}>‹ 上頁</NavButton>
            <NavButton muted={currentPage === 2} onClick={currentPage === 1 ? () => goToPage(2) : undefined}>下頁 ›</NavButton>
            <NavButton onClick={() => setSortOrder("newest")} active={sortOrder === "newest"}>最新</NavButton>
          </div>
        </nav>
        <label className="search" htmlFor="board-search">
          <span className="sr-only">搜尋文章</span>
          <input
            id="board-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜尋文章⋯"
            autoComplete="off"
          />
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="清除搜尋">×</button>}
        </label>
        <div className="post-list">
          {displayedPosts.map((post) => (
            <article
              className="post post--clickable"
              key={post.id}
              onClick={() => openArticle(post)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openArticle(post);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`開啟 ${post.date} ${post.listAuthor ?? post.author} 的文章`}
            >
              <div className="post__content"><div className="post__title"><span>[{post.category}]</span> {post.title}</div><div className="post__author">{post.listAuthor ?? post.author}</div></div>
              <time className="post__date">{post.date}</time><span className="post__more" aria-hidden="true">⋯</span>
            </article>
          ))}
          {displayedPosts.length === 0 && (
            <p className="search-empty" role="status">找不到符合「{searchQuery.trim()}」的文章</p>
          )}
        </div>
      </section>
      {dialog}
      {storyOverlay}
    </main>
  );
}
