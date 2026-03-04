// ==UserScript==
// @name           Tab Navigation and Reordering Hotkeys
// @namespace      tab_navigation_hotkeys
// @version        1.1
// @description    Use alt-j and alt-k to navigate tabs, alt-J and alt-K to move tabs
// ==/UserScript==

function key_move_tabs() {
  const POP_OUT_SOURCE_WINDOW_KEY = "ucjsHotkeysPopOutSourceWindowId";

  function getBrowserWindows() {
    let windows = [];
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let browserWindow = enumerator.getNext();
      if (!browserWindow.closed) {
        windows.push(browserWindow);
      }
    }
    return windows;
  }

  function findWindowByOuterId(outerWindowId) {
    if (!outerWindowId) {
      return null;
    }

    for (let browserWindow of getBrowserWindows()) {
      if (`${browserWindow.windowUtils.outerWindowID}` === `${outerWindowId}`) {
        return browserWindow;
      }
    }
    return null;
  }

  function findOtherWindow(currentWindow) {
    for (let browserWindow of getBrowserWindows()) {
      if (browserWindow !== currentWindow) {
        return browserWindow;
      }
    }
    return null;
  }

  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "J",
    id: "key_move_next",
    command: (win) => {
      win.gBrowser.tabContainer.advanceSelectedTab(1, true);
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "K",
    id: "key_move_prev",
    command: (win) => {
      win.gBrowser.tabContainer.advanceSelectedTab(-1, true);
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt shift",
    key: "K",
    id: "key_move_tab_up",
    command: (win) => {
      win.gBrowser.moveTabBackward();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt shift",
    key: "J",
    id: "key_move_tab_down",
    command: (win) => {
      win.gBrowser.moveTabForward();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt shift",
    key: "P",
    id: "key_toggle_tab_popout",
    command: (win) => {
      let tab = win.gBrowser.selectedTab;
      if (!tab) {
        return;
      }

      let sourceWindowId = "";
      try {
        sourceWindowId = SessionStore.getCustomTabValue(
          tab,
          POP_OUT_SOURCE_WINDOW_KEY,
        );
      } catch (_error) {}

      if (sourceWindowId) {
        let targetWindow = findWindowByOuterId(sourceWindowId) ||
          findOtherWindow(win);
        if (targetWindow && targetWindow !== win) {
          SessionStore.deleteCustomTabValue(tab, POP_OUT_SOURCE_WINDOW_KEY);
          let movedTab = targetWindow.gBrowser.adoptTab(
            tab,
            targetWindow.gBrowser.tabs.length,
            true,
          );
          targetWindow.gBrowser.selectedTab = movedTab;
          targetWindow.focus();
        }
        return;
      }

      SessionStore.setCustomTabValue(
        tab,
        POP_OUT_SOURCE_WINDOW_KEY,
        `${win.windowUtils.outerWindowID}`,
      );
      win.gBrowser.replaceTabWithWindow(tab);
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "X",
    id: "key_close_tab",
    command: (win) => {
      win.gBrowser.removeCurrentTab();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    id: "key_undo_close_tab",
    modifiers: "alt shift",
    key: "X",
    command: (window, _event) => {
      SessionStore.undoCloseTab(window, 0);
    },
  }).autoAttach({ suppressOriginalKey: true });

  // create new tab with alt-c
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "C",
    id: "key_new_tab",
    command: (win) => {
      let browser = win.gBrowser;
      let selectedTab = browser.selectedTab;
      if (!selectedTab) {
        return;
      }

      // Create a new tab with the default new tab page
      browser.addAdjacentTab(
        selectedTab,
        BROWSER_NEW_TAB_URL,
        {
          inBackground: false, // select it
          triggeringPrincipal: Services.scriptSecurityManager
            .getSystemPrincipal(),
          // optional: keep same container/group
          userContextId: selectedTab.userContextId,
          tabGroup: selectedTab.group,
        },
      );
    },
  }).autoAttach({ suppressOriginalKey: true });

  // Go Back (Alt+H)
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "H",
    id: "key_go_back",
    command: (win) => {
      win.gBrowser.goBack();
    },
  }).autoAttach({ suppressOriginalKey: true });

  // Go Forward (Alt+L)
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "L",
    id: "key_go_forward",
    command: (win) => {
      win.gBrowser.goForward();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    id: "alt-z-reload",
    modifiers: "alt",
    key: "Z",
    command: (window, _event) => {
      window.gBrowser.reloadTab(window.gBrowser.selectedTab);
    },
  }).autoAttach();

  UC_API.Hotkeys.define({
    id: "alt-s-sidebar",
    modifiers: "alt",
    key: "S",
    command: (win, _event) => {
      win.SidebarController.handleToolbarButtonClick();
    },
  }).autoAttach();

  UC_API.Hotkeys.define({
    id: "key_copy_current_url",
    modifiers: "accel alt",
    key: "C",
    reserved: "true",
    command: (win) => {
      let uri = win.gURLBar.makeURIReadable(win.gBrowser.currentURI);
      let val;
      if (uri.schemeIs("javascript") || uri.schemeIs("data")) {
        val = win.gURLBar._lastValidURLStr || win.gURLBar.value;
      } else {
        val = uri.displaySpec;
      }
      if (val) {
        Components.classes["@mozilla.org/widget/clipboardhelper;1"]
          .getService(Components.interfaces.nsIClipboardHelper)
          .copyString(val);

        UC_API.Notifications.show({
          label: "Copied URL",
          type: "copy-url",
          priority: "info",
          window: win,
          tab: win.gBrowser.selectedTab,
        });

        win.setTimeout(() => {
          let aNotificationBox = win.gBrowser.getNotificationBox(
            win.gBrowser.selectedBrowser,
          );
          let notification = aNotificationBox.getNotificationWithValue(
            "copy-url",
          );
          if (notification) {
            aNotificationBox.removeNotification(notification);
          }
        }, 500);
      }
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    id: "key_copy_current_url_markdown",
    modifiers: "accel alt shift",
    key: "C",
    reserved: "true",
    command: (win) => {
      let uri = win.gURLBar.makeURIReadable(win.gBrowser.currentURI);
      let url;
      if (uri.schemeIs("javascript") || uri.schemeIs("data")) {
        url = win.gURLBar._lastValidURLStr || win.gURLBar.value;
      } else {
        url = uri.displaySpec;
      }
      let title = win.gBrowser.contentTitle;

      if (url) {
        let val = `[${title}](${url})`;
        Components.classes["@mozilla.org/widget/clipboardhelper;1"]
          .getService(Components.interfaces.nsIClipboardHelper)
          .copyString(val);

        UC_API.Notifications.show({
          label: "Copied Markdown Link",
          type: "copy-url-markdown",
          priority: "info",
          window: win,
          tab: win.gBrowser.selectedTab,
        });

        win.setTimeout(() => {
          let aNotificationBox = win.gBrowser.getNotificationBox(
            win.gBrowser.selectedBrowser,
          );
          let notification = aNotificationBox.getNotificationWithValue(
            "copy-url-markdown",
          );
          if (notification) {
            aNotificationBox.removeNotification(notification);
          }
        }, 500);
      }
    },
  }).autoAttach({ suppressOriginalKey: true });
}

key_move_tabs();
