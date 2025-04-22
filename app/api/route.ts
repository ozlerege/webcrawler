import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

interface CrawlResult {
  url: string;
  title?: string;
  error?: string;
  text?: string;
}

const MAX_DEPTH = 2; // Limit crawling depth

async function crawl(
  currentUrl: string,
  baseUrl: string,
  visited: Set<string>,
  depth: number = 0
): Promise<CrawlResult[]> {
  if (depth > MAX_DEPTH || visited.has(currentUrl)) {
    return [];
  }

  // Ensure we only crawl URLs within the same origin
  try {
    const currentOrigin = new URL(currentUrl).origin;
    const baseOrigin = new URL(baseUrl).origin;
    if (currentOrigin !== baseOrigin) {
      return [];
    }
  } catch (e) {
    console.error(`Invalid URL encountered: ${currentUrl}`);
    return [{ url: currentUrl, error: "Invalid URL" }];
  }

  visited.add(currentUrl);
  console.log(`Crawling: ${currentUrl} at depth ${depth}`); // Log progress

  let results: CrawlResult[] = [];
  let htmlContent: string;

  try {
    const response = await axios.get(currentUrl, { timeout: 5000 }); // Add timeout
    htmlContent = response.data;
  } catch (error: any) {
    console.error(`Failed to fetch ${currentUrl}: ${error.message}`);
    return [{ url: currentUrl, error: `Failed to fetch: ${error.message}` }];
  }

  try {
    const $ = cheerio.load(htmlContent);

    // Remove script and style elements first
    $("script, style").remove();

    const title = $("title").first().text().trim();

    // Attempt to find the main content article used by GitBook
    // This selector targets a common structure but might need adjustments for different themes
    let mainContentElement = $('main div[role="main"] article');
    if (mainContentElement.length === 0) {
      // Fallback selector - sometimes the article is directly under a div with specific data attributes
      mainContentElement = $("div[data-rnwi-root] article");
    }
    if (mainContentElement.length === 0) {
      // Another fallback selector - simpler article search
      mainContentElement = $("article");
    }

    let extractedText: string;

    if (mainContentElement.length > 0) {
      console.log(`Using specific content selector for ${currentUrl}`);
      // Take the first match as the primary content
      const contentClone = mainContentElement.first().clone();

      // Remove common GitBook/documentation boilerplate *within* the selected content
      // Adjust these selectors based on actual GitBook structure if needed
      contentClone
        .find(
          'nav[aria-label="On this page"], nav[aria-labelledby*="table-of-contents"]'
        )
        .remove(); // Right sidebar/TOC
      contentClone
        .find('nav[aria-label*="pagination"], .gitbook-pagination')
        .remove(); // Previous/Next links
      contentClone.find('a[href*="edit/master"]').closest("div, p").remove(); // "Edit this page" links
      contentClone.find("footer").remove(); // Any footers within the article
      contentClone.find('div:contains("Last updated")').last().remove(); // Last updated div
      contentClone
        .find(
          'h1 a[href^="#"], h2 a[href^="#"], h3 a[href^="#"], h4 a[href^="#"], h5 a[href^="#"], h6 a[href^="#"]'
        )
        .remove(); // Remove anchor links within headers
      contentClone.find(".header-anchor").remove(); // Common class for header anchors

      extractedText = contentClone.text();
    } else {
      // Fallback: Use the body-minus-boilerplate approach if specific selectors fail
      console.warn(
        `Could not find specific GitBook content for ${currentUrl}, falling back to body extraction.`
      );
      const bodyClone = $("body").clone();
      // Remove broader set of common non-content tags
      bodyClone
        .find(
          "header, footer, nav, aside, form, [role='navigation'], [role='banner'], [role='contentinfo'], .sidebar, #sidebar"
        )
        .remove();
      extractedText = bodyClone.text();
    }

    // Clean up whitespace aggressively
    const cleanedText = extractedText.replace(/\s+/g, " ").trim();

    results.push({
      url: currentUrl,
      title: title || undefined,
      text: cleanedText || undefined,
    });

    if (depth < MAX_DEPTH) {
      const linkPromises: Promise<CrawlResult[]>[] = [];
      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href) {
          let nextUrl: URL | null = null;
          try {
            // Resolve relative URLs
            nextUrl = new URL(href, currentUrl);
            // Clean up the URL (remove fragment)
            nextUrl.hash = "";
            const nextUrlString = nextUrl.toString();

            // Check origin again before queueing crawl
            if (
              nextUrl.origin === new URL(baseUrl).origin &&
              !visited.has(nextUrlString)
            ) {
              linkPromises.push(
                crawl(nextUrlString, baseUrl, visited, depth + 1)
              );
            }
          } catch (e) {
            // Ignore invalid URLs found in links
            console.warn(
              `Ignoring invalid link href: ${href} on page ${currentUrl}`
            );
          }
        }
      });

      const nestedResults = await Promise.all(linkPromises);
      results = results.concat(...nestedResults);
    }
  } catch (error: any) {
    console.error(`Failed to parse ${currentUrl}: ${error.message}`);
    // Add error for the current page if parsing failed, but don't stop crawling siblings/children
    const existingResult = results.find((r) => r.url === currentUrl);
    if (existingResult) {
      existingResult.error = `Failed to parse: ${error.message}`;
    } else {
      results.push({
        url: currentUrl,
        error: `Failed to parse: ${error.message}`,
      });
    }
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Validate the initial URL
    new URL(url);
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid URL provided" },
      { status: 400 }
    );
  }

  const visited = new Set<string>();
  try {
    const data = await crawl(url, url, visited);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Crawling failed for ${url}: ${error.message}`);
    return NextResponse.json(
      { error: "Crawling failed", details: error.message },
      { status: 500 }
    );
  }
}
