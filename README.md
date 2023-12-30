# NextStatusProxy

## Overview

NextStatusProxy is a middleware designed for Next.js applications that need custom status code handling. As of Next.js 13, setting custom status codes directly in responses is not supported. This middleware provides a solution by allowing developers to set custom status codes via meta tags in their Next.js applications. The middleware intercepts these responses, extracts the custom status code from the meta tag, and sets it in the response to the client.

## Features

- **Custom Status Code Handling**: Allows setting custom status codes via meta tags.
- **Path Ignoring Capability**: Exclude specific paths from processing using a `.proxystatusignore` file.
- **Seamless Integration with Next.js**: Designed to work specifically with Next.js applications.
- **Streaming Support**: Preserves the streaming functionality of Next.js responses.
- **Developer and SEO Friendly**: Enhances development flexibility and SEO capabilities.

## Installation

To get started, clone this repository and install the required dependencies.

```bash
git clone https://the-repository-url.git
cd next-status-proxy
npm install
```

## Configuration

### Middleware Setup

Create a `.env` file in the root of your project and configure it as per `.env.example`:

```bash
TARGET_URL=http://localhost:3000
TARGET_META_NAME=app:status
PROXY_PORT=3001
```

#### Path Ignoring Feature

Create a `.proxystatusignore` file in the project root and list patterns for paths you want to ignore. Each pattern should be on a new line. The middleware will not process responses for these paths. Ideally, all paths in your Next.js project, except the page paths in your app folder, should be included here.

Example `.proxystatusignore` content:

```bash
/api/*
/_next*
/sitemap/*
/favicon.ico
/robots.txt
/*.svg
/*.png
/*.html
```

### Next.js Project Setup

In your Next.js project, configure the metadata in your pages as follows.

```bash
export const metadata: Metadata = {
  other: {
    'app:status': 410 // Example status code
  }
};
```

## Usage

To start the proxy server, run:

```bash
npm run build
npm start
```

This runs the proxy middleware on the `PROXY_PORT`, directing requests to the `TARGET_URL`.

## How It Works

The middleware checks for a specific meta tag (`app:status`) in the Next.js server responses. If found, the middleware uses its value to set the status code in the client response. Additionally, it respects path ignore patterns defined in `.proxystatusignore`.
