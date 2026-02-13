const axios = require('axios');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const logger = require('../logger/logger');

/**
 * Parses sitemap XML and extracts all URLs
 * Handles both regular sitemaps and sitemap indexes
 */

async function parseSitemap(sitemapUrl) {
  logger.info(`Parsing sitemap: ${sitemapUrl}`);

  try {
    let xmlData;

    // Handle file:// URLs and local file paths
    if (sitemapUrl.startsWith('file://')) {
      const filePath = sitemapUrl.replace('file://', '').replace(/^\/([a-z]:)/i, '$1');
      xmlData = fs.readFileSync(filePath, 'utf-8');
    } else if (!sitemapUrl.startsWith('http://') && !sitemapUrl.startsWith('https://')) {
      // Assume it's a local file path
      xmlData = fs.readFileSync(sitemapUrl, 'utf-8');
    } else {
      // HTTP/HTTPS URL
      const response = await axios.get(sitemapUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SitemapBot/1.0'
        }
      });
      xmlData = response.data;
    }

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    // Check if it's a sitemap index
    if (result.sitemapindex) {
      return await parseSitemapIndex(result.sitemapindex, sitemapUrl);
    }

    // Regular sitemap
    if (result.urlset) {
      return extractUrlsFromSitemap(result.urlset);
    }

    logger.warn('Unrecognized sitemap format');
    return [];
  } catch (error) {
    logger.error(`Failed to parse sitemap: ${error.message}`);
    throw new Error(`Sitemap parse error: ${error.message}`);
  }
}

async function parseSitemapIndex(sitemapindex, baseUrl) {
  const sitemapUrls = [];

  if (!sitemapindex.sitemap) {
    return [];
  }

  const sitemaps = Array.isArray(sitemapindex.sitemap)
    ? sitemapindex.sitemap
    : [sitemapindex.sitemap];

  logger.info(`Found ${sitemaps.length} sitemaps in index`);

  // Parse each sitemap recursively
  for (const sitemap of sitemaps) {
    const sitemapUrl = sitemap.loc[0];
    try {
      logger.debug(`Parsing child sitemap: ${sitemapUrl}`);
      const urls = await parseSitemap(sitemapUrl);
      sitemapUrls.push(...urls);
    } catch (error) {
      logger.error(`Failed to parse child sitemap ${sitemapUrl}: ${error.message}`);
    }
  }

  return sitemapUrls;
}

function extractUrlsFromSitemap(urlset) {
  const urls = [];

  if (!urlset.url) {
    logger.warn('No URLs found in sitemap');
    return urls;
  }

  const urlEntries = Array.isArray(urlset.url) ? urlset.url : [urlset.url];

  urlEntries.forEach(entry => {
    if (entry.loc && entry.loc[0]) {
      const url = entry.loc[0].trim();
      if (isValidUrl(url)) {
        urls.push({
          url,
          lastmod: entry.lastmod ? entry.lastmod[0] : null,
          changefreq: entry.changefreq ? entry.changefreq[0] : null,
          priority: entry.priority ? parseFloat(entry.priority[0]) : null
        });
      } else {
        logger.warn(`Invalid URL in sitemap: ${url}`);
      }
    }
  });

  logger.info(`Extracted ${urls.length} URLs from sitemap`);
  return urls;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseSitemap,
  extractUrlsFromSitemap,
  isValidUrl
};
