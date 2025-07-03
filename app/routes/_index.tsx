import React from "react";

export default function Index() {
  return (
    <div>
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="flex items-center justify-between p-2 max-w-full">
          <div className="flex items-center gap-2">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%234F46E5'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='16' font-weight='bold'%3EBD%3C/text%3E%3C/svg%3E"
              alt="BoltDIY"
              className="w-6 h-6"
            />
            <h1 className="text-lg font-bold text-white hidden sm:block">BoltDIY Agent Platform</h1>
          </div>

          <div className="flex items-center gap-2">
            <div id="agent-status" className="bg-gray-700 px-2 py-1 rounded text-xs hidden sm:block">
              <span className="agent-indicator">🤖</span>
              <span className="agent-name">جاهز</span>
            </div>
            <button id="settings-btn" className="p-2 hover:bg-gray-700 rounded">
              <i className="fas fa-cog text-gray-300"></i>
            </button>
            <button id="toggle-sidebar" className="p-2 hover:bg-gray-700 rounded lg:hidden">
              <i className="fas fa-bars text-gray-300"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside id="sidebar" className="w-64 bg-gray-800 border-r border-gray-700 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 fixed lg:relative z-30 h-full overflow-y-auto">
          {/* File Explorer */}
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">الملفات</h3>
              <button id="new-file-btn" className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">
                <i className="fas fa-plus mr-1"></i>جديد
              </button>
            </div>
            <div id="file-tree" className="text-sm">
              {/* سيتم ملؤها بـ JavaScript */}
            </div>
          </div>

          {/* Agent Context */}
          <div id="agent-context" className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">سياق الوكيل</h3>
            {/* سيتم ملؤها بـ JavaScript */}
          </div>

          {/* Tools & Actions */}
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2">الأدوات</h3>
            <div className="space-y-1">
              <button className="w-full text-left text-xs p-2 hover:bg-gray-700 rounded">
                <i className="fas fa-search mr-2"></i>بحث دلالي (Ctrl+K)
              </button>
              <button className="w-full text-left text-xs p-2 hover:bg-gray-700 rounded">
                <i className="fas fa-terminal mr-2"></i>المحطة الطرفية
              </button>
              <button className="w-full text-left text-xs p-2 hover:bg-gray-700 rounded">
                <i className="fas fa-camera mr-2"></i>OCR - تحليل الصور
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor Container */}
          <div className="flex-1 relative">
            <div id="monaco-container" className="w-full h-full">
              {/* سيتم تحميل Monaco Editor هنا */}
            </div>
          </div>

          {/* Terminal */}
          <div id="terminal-container" className="h-48 bg-black border-t border-gray-700 hidden">
            <div className="flex items-center justify-between bg-gray-800 px-3 py-1 border-b border-gray-700">
              <span className="text-xs text-gray-300">المحطة الطرفية</span>
              <button id="toggle-terminal" className="text-xs text-gray-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div id="terminal" className="h-full">
              {/* سيتم تحميل xterm.js هنا */}
            </div>
          </div>
        </main>
      </div>

      {/* AI Agent Input */}
      <div className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)]">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <span className="text-sm font-medium text-white">🤖 مساعد الذكاء الاصطناعي</span>
            <button id="minimize-ai" className="text-gray-400 hover:text-white">
              <i className="fas fa-minus"></i>
            </button>
          </div>
          <div className="p-3">
            <textarea
              id="agent-input"
              placeholder="اسأل الوكيل الذكي..."
              className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded p-2 text-sm resize-none focus:outline-none focus:border-blue-500"
              rows={2}
            ></textarea>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                <span className="text-xs text-gray-500">اضغط Enter للإرسال</span>
              </div>
              <button id="send-agent" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                إرسال
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <div id="search-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-start justify-center pt-20">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <i className="fas fa-search text-gray-400"></i>
              <input
                id="search-input"
                type="text"
                placeholder="البحث الدلالي..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
              />
              <button id="close-search" className="text-gray-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div id="search-results" className="max-h-96 overflow-y-auto">
            {/* نتائج البحث */}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <div id="settings-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">الإعدادات</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">مفتاح OpenAI API</label>
              <input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">مفتاح Anthropic API</label>
              <input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">مفتاح Google AI API</label>
              <input
                id="google-key"
                type="password"
                placeholder="AIza..."
                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded p-2 text-sm"
              />
            </div>
          </div>
          <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
            <button id="cancel-settings" className="px-4 py-2 text-gray-300 hover:text-white">
              إلغاء
            </button>
            <button id="save-settings" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
              حفظ
            </button>
          </div>
        </div>
      </div>

      {/* OCR Modal */}
      <div id="ocr-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">تحليل الصور (OCR)</h3>
          </div>
          <div className="p-4">
            <div id="drop-zone" className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-300 mb-2">اسحب الصورة هنا أو انقر للاختيار</p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF - حتى 10MB</p>
              <input id="file-input" type="file" accept="image/*" className="hidden" />
            </div>
            <div id="ocr-results" className="mt-4 hidden">
              {/* نتائج OCR */}
            </div>
          </div>
          <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
            <button id="close-ocr" className="px-4 py-2 text-gray-300 hover:text-white">
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div id="toast-container" className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm"></div>
    </div>
  );
}