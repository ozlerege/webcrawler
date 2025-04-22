# Web Crawler API

A simple web crawler API built with Next.js.

## Description

This API endpoint accepts a starting URL, crawls web pages starting from that URL up to a defined depth, extracts text content (with specific logic for GitBook sites), and returns the collected data as JSON. It avoids crawling external sites and has a timeout mechanism.

## Running Locally

1.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

3.  **Access the API:**
    Open your browser or use a tool like `curl` to access the endpoint:
    ```
    http://localhost:3000/api?url=<your-target-url>
    ```
    Replace `<your-target-url>` with the URL you want to start crawling (e.g., `http://localhost:3000/api?url=https://docs.gitbook.com/`).

## Features

- Crawls websites starting from a given URL.
- Limits crawl depth (`MAX_DEPTH = 2`).
- Stays within the same origin as the starting URL.
- Extracts page titles and text content.
- Attempts to extract main content specifically from GitBook structures.
- Includes timeout for fetching pages.
- Returns results in JSON format.
