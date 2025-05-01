// This is the entry point for the YouTube content script
(async () => {
    const src = chrome.runtime.getURL("build/youtubeContentMain.js");
    const youtubeContentMain = await import(src);
    youtubeContentMain.main();
})(); 