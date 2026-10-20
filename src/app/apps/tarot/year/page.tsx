import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs, TarotCta } from "@/components/TarotPages";
import { TAROT_CARDS, cardImg, cardPath, newYear } from "@/lib/tarot-cards";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";

const PATH = "/apps/tarot/year";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  const y = newYear();
  const title = lang === "ko" ? `${y} 신년운세 타로 · 무료 올해 운세 타로 카드` : `${y} New Year Tarot · Free Year-Ahead Reading`;
  const description =
    lang === "ko"
      ? `${y}년 한 해의 흐름을 타로 카드로 봐요. 상반기·하반기·한 해의 조언 3장을 직접 뽑고, 메이저 아르카나 22장이 말하는 ${y}년 운세를 확인하세요. 무료, 회원가입 없음.`
      : `See the year ahead in ${y} with tarot. Draw three cards for the first half, second half and advice for the year. Free, no sign-up.`;
  return {
    title: { absolute: title },
    description,
    alternates: langAlternates(PATH, lang, fromParam),
    openGraph: { title, description, images: [{ url: "/thumbs/tarot.jpg" }], type: "website" },
  };
}

export default async function Page() {
  const { lang } = await serverLang();
  const ko = lang === "ko";
  const y = newYear();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ko ? `${y} 신년운세 타로` : `${y} New Year tarot`,
    url: `${SITE_URL}${PATH}`,
    inLanguage: lang,
  };
  return (
    <div className="wrap mid legal tarot-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs items={[{ name: ko ? "타로 운세" : "Tarot Reading", href: "/apps/tarot" }, { name: ko ? `${y} 신년운세` : `${y} New Year` }]} />
      <h1 className="page-title">{ko ? `${y} 신년운세 타로` : `${y} New Year Tarot Reading`}</h1>
      <p>
        {ko
          ? `새해가 오기 전, ${y}년이 어떤 흐름으로 흘러갈지 타로 카드로 미리 살펴보세요. 섞인 메이저 아르카나 22장 중에서 직접 세 장을 고르면 상반기, 하반기, 그리고 한 해 동안 기억할 조언을 알려 드려요. 역방향 카드도 함께 읽어서 조심할 부분까지 짚어 드립니다.`
          : `Before the new year arrives, see how ${y} might unfold. Pick three cards from the shuffled 22 Major Arcana for the first half, the second half and advice to carry through the year. Reversed cards are read too, so you'll know what to watch out for.`}
      </p>
      <TarotCta lang={lang} href={`/apps/tarot?start=year&y=${y}`} label={ko ? `${y} 신년운세 카드 뽑기` : `Draw my ${y} cards`} />
      <h2>{ko ? "이렇게 봐요" : "How it works"}</h2>
      <ol>
        <li>{ko ? "마음속으로 새해에 바라는 것이나 걱정되는 것을 떠올려요." : "Think of what you hope for — or worry about — in the new year."}</li>
        <li>{ko ? "섞인 카드가 부채꼴로 펼쳐지면 마음이 가는 카드 세 장을 골라요." : "When the cards fan out, pick the three that call to you."}</li>
        <li>{ko ? "상반기·하반기·한 해의 조언 순서로 카드가 뒤집히고 해석이 나와요." : "They turn over as first half, second half and advice, with a reading for each."}</li>
        <li>{ko ? "결과는 링크나 이미지로 친구에게 보내고, 친구의 신년운세도 받아 보세요." : "Share your result as a link or image, and see your friends' readings too."}</li>
      </ol>
      <h2>{ko ? `카드별 ${y} 운세 한 줄` : `Each card's message for ${y}`}</h2>
      <ul className="tarot-yearlist">
        {TAROT_CARDS.map((c) => (
          <li key={c.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardImg(c, 300)} alt="" width={44} height={76} loading="lazy" />
            <div>
              <Link href={cardPath(c)}>
                <b>{c.name[lang]}</b>
              </Link>
              <p>{c.readings.year.up[lang]}</p>
            </div>
          </li>
        ))}
      </ul>
      <TarotCta lang={lang} href={`/apps/tarot?start=year&y=${y}`} label={ko ? `${y} 신년운세 카드 뽑기` : `Draw my ${y} cards`} />
      <p className="small dim">{ko ? "타로는 재미로 보는 참고용이에요. 중요한 결정은 스스로 판단하세요." : "Tarot is for fun and reflection."}</p>
    </div>
  );
}
