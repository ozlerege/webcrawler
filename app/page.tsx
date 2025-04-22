"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

// Define the interface for the scraped data
interface ScrapedDataItem {
  url: string;
  title?: string;
  text?: string;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [scrapedData, setScrapedData] = useState<ScrapedDataItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScrapedDataItem | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Add custom animation styles
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.4s ease-in-out forwards;
    }
    .dialog-backdrop {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .dialog-content {
      animation: scaleIn 0.3s ease-out forwards;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;

  const handleScrape = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api?url=${url}`);
      const data = await response.json();
      setScrapedData(data);
    } catch (error) {
      setError("Failed to scrape website");
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (item: ScrapedDataItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling when dialog is open
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    document.body.style.overflow = ""; // Restore scrolling
  };

  // Handle clicking outside the dialog to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        closeDialog();
      }
    };

    if (isDialogOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDialogOpen]);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
      }
    };

    if (isDialogOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isDialogOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <style jsx>{animationStyles}</style>
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-all">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Web Scraper
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center max-w-lg">
            Enter a URL to extract content from any website.
          </p>
          <div className="flex flex-col sm:flex-row w-full max-w-xl gap-3 mt-2">
            <input
              className="flex-grow border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <button
              onClick={handleScrape}
              disabled={isLoading || !url}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isLoading || !url
                  ? "bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Scraping...
                </span>
              ) : (
                "Scrape"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="w-full p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!isLoading && scrapedData.length > 0 && (
          <div className="w-full animate-fadeIn">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700">
              Results
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scrapedData.map((item) => (
                <div
                  key={item.url}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all flex flex-col h-full cursor-pointer"
                  onClick={() => openDialog(item)}
                >
                  <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400 break-words">
                    {item.title || "No Title Found"}
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded text-xs text-gray-600 dark:text-gray-300 mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.url}
                  </div>
                  {item.error ? (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-auto bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      Error: {item.error}
                    </p>
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300 overflow-hidden flex-grow bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
                      {item.text ? (
                        item.text.substring(0, 250) +
                        (item.text.length > 250 ? "..." : "")
                      ) : (
                        <span className="text-gray-400 italic">
                          No text content extracted.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && !error && (
          <div className="flex flex-col items-center justify-center my-12 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Processing your request...
            </p>
          </div>
        )}
      </div>

      {/* Dialog for showing full content */}
      {isDialogOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 dialog-backdrop">
          <div
            ref={dialogRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col dialog-content"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-4">
                {selectedItem.title || "No Title Found"}
              </h3>
              <button
                onClick={closeDialog}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 break-all">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  URL:{" "}
                </span>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedItem.url}
                </a>
              </div>

              {selectedItem.error ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
                  <p className="font-medium mb-1">Error:</p>
                  <p>{selectedItem.error}</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[50vh] bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
                  {selectedItem.text ? (
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                      {selectedItem.text}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No text content extracted.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
