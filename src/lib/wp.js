/**
 * WordPress REST API client for the blog.
 *
 * Posts live in WordPress at blog.wpaiscanner.com and are pulled at build
 * time, so the published site stays fully static — no runtime calls, no
 * dependency on the CMS being up once a build has shipped.
 *
 * Publishing a post in WordPress therefore requires a rebuild to appear here.
 */

const API_BASE = (
  import.meta.env.WP_API_URL || 'https://blog.wpaiscanner.com/wp-json/wp/v2'
).replace(/\/$/, '');

/** Where the posts live, used to rewrite in-content links back to this site. */
const WP_ORIGIN = new URL(API_BASE).origin;

const PER_PAGE = 100;
const WORDS_PER_MINUTE = 200;

/**
 * Named entities WordPress emits in rendered titles and excerpts. The numeric
 * forms (&#8217; and &#x2019;) are handled generically below.
 */
const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  deg: '\u00b0',
  times: '\u00d7',
  minus: '\u2212',
  '#039': "'",
};

/** Decode the HTML entities WordPress puts in `*.rendered` plain-text fields. */
function decodeEntities(value) {
  return String(value ?? '').replace(/&(#x?[0-9a-f]+|[a-z0-9#]+);/gi, (match, entity) => {
    const key = entity.toLowerCase();

    if (key.startsWith('#x')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }

    if (key.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }

    return NAMED_ENTITIES[key] ?? match;
  });
}

/** Rendered HTML → plain text, for excerpts, descriptions, and word counts. */
function stripTags(html) {
  return decodeEntities(
    String(html ?? '')
      // Script/style bodies would otherwise land in the plain text.
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function readingTime(html) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`;
}

/**
 * WordPress excerpts arrive wrapped in <p> and end in a "[…]" continuation
 * marker. Strip both, then trim to a sentence boundary so the card copy and
 * the meta description read as prose rather than a truncated fragment.
 */
function toDescription(post) {
  const excerpt = stripTags(post.excerpt?.rendered)
    .replace(/\s*\[\u2026\]\s*$/, '\u2026')
    .replace(/\s*\[&hellip;\]\s*$/, '\u2026');

  const text = excerpt || stripTags(post.content?.rendered);
  if (text.length <= 200) return text;

  const clipped = text.slice(0, 200);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 120 ? clipped.slice(0, lastSpace) : clipped).replace(/[\s.,;:\u2014-]+$/, '')}\u2026`;
}

/**
 * WordPress serves dates without a zone designator; `date_gmt` is UTC, so
 * append the Z rather than letting the build machine's locale decide.
 */
function toDate(gmt, fallback) {
  const raw = gmt || fallback;
  if (!raw) return new Date(0);
  return new Date(/[Z+]|-\d{2}:\d{2}$/.test(raw) ? raw : `${raw}Z`);
}

/**
 * Point in-content links at this site instead of the WordPress origin, so a
 * reader never leaves for the CMS domain, and drop WordPress's lazy-loading
 * of the first image, which would otherwise delay the article's LCP.
 */
function rewriteContent(html) {
  return String(html ?? '')
    .replace(
      new RegExp(`(href=["'])${WP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?!wp-)([^"'#?]*)`, 'gi'),
      (_match, prefix, path) => `${prefix}/blog/${path.replace(/^\/+/, '')}`
    )
    .replace(/\s(?:loading|fetchpriority)="[^"]*"/gi, '');
}

function featuredImage(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media || media.source_url == null) return null;

  const sizes = media.media_details?.sizes ?? {};
  const preferred = sizes.large ?? sizes.medium_large ?? sizes.full;

  return {
    src: preferred?.source_url ?? media.source_url,
    width: preferred?.width ?? media.media_details?.width ?? null,
    height: preferred?.height ?? media.media_details?.height ?? null,
    alt: decodeEntities(media.alt_text || ''),
  };
}

function primaryCategory(post) {
  const terms = post._embedded?.['wp:term'] ?? [];
  const category = terms.flat().find((term) => term?.taxonomy === 'category');
  return category ? decodeEntities(category.name) : 'Guide';
}

function normalize(post) {
  const content = rewriteContent(post.content?.rendered);
  const published = toDate(post.date_gmt, post.date);
  const modified = toDate(post.modified_gmt, post.modified);

  return {
    id: post.id,
    slug: post.slug,
    title: decodeEntities(post.title?.rendered),
    description: toDescription(post),
    content,
    pubDate: published,
    // Only surface a modified date when it is genuinely later than publication.
    updatedDate: modified > published ? modified : null,
    category: primaryCategory(post),
    tags: (post._embedded?.['wp:term'] ?? [])
      .flat()
      .filter((term) => term?.taxonomy === 'post_tag')
      .map((term) => decodeEntities(term.name)),
    author: decodeEntities(post._embedded?.author?.[0]?.name || 'The Crawlwise team'),
    image: featuredImage(post),
    readingTime: readingTime(post.content?.rendered),
  };
}

async function request(path) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`WordPress REST API responded ${response.status} for ${url}`);
  }

  return response;
}

/**
 * Build-time fetches happen once per process: the listing page and every post
 * page share this promise rather than each hitting the API.
 */
let cache;

async function loadPosts() {
  const posts = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await request(
      `/posts?per_page=${PER_PAGE}&page=${page}&status=publish&orderby=date&order=desc&_embed=1`
    );

    totalPages = Number.parseInt(response.headers.get('x-wp-totalpages') || '1', 10) || 1;
    posts.push(...(await response.json()));
    page += 1;
  } while (page <= totalPages);

  return posts.map(normalize);
}

/** Every published post, newest first. Throws if WordPress is unreachable. */
export async function getPosts() {
  if (!cache) {
    cache = loadPosts().catch((error) => {
      // Clear the cache so a retry within the same build can succeed.
      cache = undefined;
      throw new Error(
        `Failed to load blog posts from ${API_BASE}. The build cannot continue without them.\n${error.message}`,
        { cause: error }
      );
    });
  }

  return cache;
}

export async function getPost(slug) {
  return (await getPosts()).find((post) => post.slug === slug);
}
