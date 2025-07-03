import React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "BoltDIY - Agent Platform المتقدمة" },
    { name: "description", content: "منصة الذكاء الاصطناعي الشاملة مع نظام إدارة الوكلاء المتقدم" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "theme-color", content: "#1f2937" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.json" },
  // TailwindCSS
  { rel: "stylesheet", href: "https://cdn.tailwindcss.com" },
  // Font Awesome
  { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" },
  // Monaco Editor
  { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css" },
];

export default function App() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-900 text-white antialiased">
        <Outlet />
        <ScrollRestoration />
        
        {/* External Scripts */}
        <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js" />
        <script src="https://unpkg.com/@xenova/transformers@2.17.2/dist/transformers.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/yjs@13.6.10/dist/yjs.umd.min.js" />
        
        {/* Application Scripts */}
        <script src="/js/unified-ai-api.js" defer />
        <script src="/js/agent-tools.js" defer />
        <script src="/js/agent-manager.js" defer />
        <script src="/js/admin-dashboard.js" defer />
        <script src="/js/app.js" defer />
        <script src="/js/monaco-setup.js" defer />
        <script src="/js/semantic-search.js" defer />
        <script src="/js/ocr-handler.js" defer />
        <script src="/js/terminal.js" defer />
        <script src="/js/ai-agent.js" defer />
        <script src="/js/mobile-handlers.js" defer />
        
        <Scripts />
      </body>
    </html>
  );
}