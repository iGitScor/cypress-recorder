var path;

function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true,
  };

  chrome.tabs.query(queryInfo, tabs => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl(url => {
    document.getElementById('record').addEventListener('click', () => {
      path = 'icon-cypress-record.png';
      chrome.browserAction.setIcon({ path });
      chrome.tabs.executeScript({
        file: '/start.js',
      });
    });

    document.getElementById('status').addEventListener('click', () => {
      chrome.tabs.executeScript({
        file: '/status.js',
      });
    });

    document.getElementById('reset').addEventListener('click', () => {
      path = 'icon-cypress.png';
      chrome.browserAction.setIcon({ path });
      chrome.tabs.executeScript({
        file: '/reset.js',
      });
    });

    document.getElementById('save').addEventListener('click', () => {
      path = 'icon-cypress-saved.png';
      chrome.browserAction.setIcon({ path });
      chrome.tabs.executeScript({
        file: '/save.js',
      });
    });

    document.getElementById('pause').addEventListener('click', () => {
      path = 'icon-cypress.png';
      chrome.browserAction.setIcon({ path });
      chrome.tabs.executeScript({
        file: '/pause.js',
      });
    });
  });
});
