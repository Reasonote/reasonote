// This is the entry point for the content script
(async () => {
    const src = chrome.runtime.getURL("build/contentMain.js");
    const contentMain = await import(src);
    contentMain.main();
})();