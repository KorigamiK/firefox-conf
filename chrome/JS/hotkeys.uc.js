// ==UserScript==
// @name           Tab Navigation and Reordering Hotkeys
// @namespace      tab_navigation_hotkeys
// @version        1.1
// @description    Use alt-j and alt-k to navigate tabs, alt-J and alt-K to move tabs
// ==/UserScript==

function key_move_tabs() {
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "J",
    id: "key_move_next",
    command: (_win) => {
      gBrowser.tabContainer.advanceSelectedTab(1, true);
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "K",
    id: "key_move_prev",
    command: (_win) => {
      gBrowser.tabContainer.advanceSelectedTab(-1, true);
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt shift",
    key: "K",
    id: "key_move_tab_up",
    command: (_win) => {
      gBrowser.moveTabBackward();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt shift",
    key: "J",
    id: "key_move_tab_down",
    command: (_win) => {
      gBrowser.moveTabForward();
    },
  }).autoAttach({ suppressOriginalKey: true });

  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "X",
    id: "key_close_tab",
    command: (_win) => {
      gBrowser.removeCurrentTab();
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
    command: (_win) => {
      // Create a new tab with the default new tab page
      gBrowser.addAdjacentTab(
        gBrowser.selectedTab,
        BROWSER_NEW_TAB_URL,
        {
          inBackground: false, // select it
          triggeringPrincipal: Services.scriptSecurityManager
            .getSystemPrincipal(),
          // optional: keep same container/group
          userContextId: gBrowser.selectedTab.userContextId,
          tabGroup: gBrowser.selectedTab.group,
        },
      );
    },
  }).autoAttach({ suppressOriginalKey: true });

  // Go Back (Alt+H)
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "H",
    id: "key_go_back",
    command: (_win) => {
      gBrowser.goBack();
    },
  }).autoAttach({ suppressOriginalKey: true });

  // Go Forward (Alt+L)
  UC_API.Hotkeys.define({
    modifiers: "alt",
    key: "L",
    id: "key_go_forward",
    command: (_win) => {
      gBrowser.goForward();
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
    command: (_window, _event) => {
      SidebarController.handleToolbarButtonClick();
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
          let aNotificationBox = win.gBrowser.getNotificationBox(win.gBrowser.selectedBrowser);
          let notification = aNotificationBox.getNotificationWithValue("copy-url");
          if (notification) {
            aNotificationBox.removeNotification(notification);
          }
        }, 1000);
      }
    },
  }).autoAttach({ suppressOriginalKey: true });

}

key_move_tabs();
