import {
  BasicExampleFactory,
  HelperExampleFactory,
  KeyExampleFactory,
  PromptExampleFactory,
  UIExampleFactory,
} from "./modules/examples";
import { config } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();

  BasicExampleFactory.registerPrefs();

  BasicExampleFactory.registerNotifier();

  await onMainWindowLoad(window);
}

function registerMenu() {
  const siyuanButton = {
    tag: "toolbarbutton",
    id: "siyuan-note",
    class: ["zotero-tb-button"],
    attributes: {
      type: "button",
      tooltiptext: "SiYuan Note",
      tabindex: "-1",
    },
    listeners: [
      {
        type: "mousedown",
        listener: () => {
          const pannel = Zotero.getActiveZoteroPane();
          const item = pannel.getSelectedItems();
          if (item.length == 0) {
            const nullAlert = new ztoolkit.Dialog(3, 4)
              .addCell(0, 0, {
                tag: "p",
                properties: {
                  innerHTML: "没有选中条目",
                },
              })
              .open("警告");
            return;
          }
          const siyuanLink = item[0].getField("extra");
          if (
            typeof siyuanLink == "string" &&
            siyuanLink.startsWith("siyuan://blocks")
          ) {
            Zotero.launchURL(siyuanLink);
          }

          else {
            const nullAlert = new ztoolkit.Dialog(3, 4)
              .addCell(0, 0, {
                tag: "p",
                properties: {
                  innerHTML: "没有在“其它”字段中找到 思源笔记 的链接",
                },
              })
              .open("警告");
          }
        },
      },
    ],
    children: [
      {
        tag: "image",
        id: "siyuan-note-icon",
        class: ["toolbarbutton-icon"],

        attributes: {
          src: `chrome://${config.addonRef}/content/icons/icon1.png`,
          height: "15",
          width: "16",
        },
      },
      {
        tag: "label",
        class: ["toolbarbutton-text"],
      },
    ],
  };

  const node = document.querySelector("#zotero-tb-advanced-search");
  if (node != null) {
    ztoolkit.UI.insertElementBefore(siyuanButton, node);
  }
}
function registerMenu2(syurl: string) {

  // button tabindex="-1" class="toolbarButton underline"
  //       title="Underline Text"></button><span class="button-background"></span>
  const siyuanButton = {
    tag: "a",
    id: "siyuan-note-icon-reader",
    classList: ["toolbarbutton-icon"],

    attributes: {
      href: syurl,
      height: "15",
      width: "16",
    },
    children: [
      {
        tag: "span",
        classList: ["button-background"]
      },
      {
        tag: "button",
        id: "siyuan-note-reader",
        classList: ["toolbarButton", "note"],
        namespace: "html",
        attributes: {
          title: "SiYuan Note",
          tabindex: "-1",

        },
      }
    ],
  };
  let a = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)._iframeWindow
  ztoolkit.log("123:", a)
  if (a == undefined) return
  let node = a.document.querySelector("#viewFind")
  ztoolkit.log("456:", node)
  if (node != null) {
    let newscript = a.document.createElement("script")

    ztoolkit.UI.insertElementBefore(siyuanButton, node)
    // let syb = ztoolkit.UI.createElement(a?.document, "button", siyuanButton)
    // node.appendChild(syb)

  }

  // const node = document.querySelector("#zotero-tb-search");
  // if (node != null) {
  //   ztoolkit.UI.insertElementBefore(siyuanButton, node);
  // }
}
async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  // const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
  //   closeOnClick: true,
  //   closeTime: -1,
  // })
  //   .createLine({
  //     text: getString("startup-begin"),
  //     type: "default",
  //     progress: 0,
  //   })
  //   .show();

  // KeyExampleFactory.registerShortcuts();

  // await Zotero.Promise.delay(1000);
  // popupWin.changeLine({
  //   progress: 30,
  //   text: `[30%] ${getString("startup-begin")}`,
  // });

  // UIExampleFactory.registerStyleSheet();

  // UIExampleFactory.registerRightClickMenuItem();

  // UIExampleFactory.registerRightClickMenuPopup();

  // UIExampleFactory.registerWindowMenuWithSeparator();

  // await UIExampleFactory.registerExtraColumn();

  // await UIExampleFactory.registerExtraColumnWithCustomCell();
  await Promise.all([registerMenu()]);
  // await UIExampleFactory.registerCustomItemBoxRow();

  // UIExampleFactory.registerLibraryTabPanel();

  // await UIExampleFactory.registerReaderTabPanel();

  // PromptExampleFactory.registerNormalCommandExample();

  // PromptExampleFactory.registerAnonymousCommandExample();

  // PromptExampleFactory.registerConditionalCommandExample();

  // await Zotero.Promise.delay(1000);

  // popupWin.changeLine({
  //   progress: 100,
  //   text: `[100%] ${getString("startup-finish")}`,
  // });
  // popupWin.startCloseTimer(2000);

  // addon.hooks.onDialogEvents("dialogExample");
  Zotero.log("hello");
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (
    event == "add" &&
    type == "tab"
  ) {

    // BasicExampleFactory.exampleNotifierCallback();
    await Zotero.Promise.delay(1000);
    let siyuanLink = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)._item.parentItem?.getField("extra");

    if (
      typeof siyuanLink == "string" &&
      siyuanLink.startsWith("siyuan://blocks")
    ) {
      registerMenu2(siyuanLink);
      // Zotero.launchURL(siyuanLink);
    }


  } else {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  switch (type) {
    case "larger":
      KeyExampleFactory.exampleShortcutLargerCallback();
      break;
    case "smaller":
      KeyExampleFactory.exampleShortcutSmallerCallback();
      break;
    case "confliction":
      KeyExampleFactory.exampleShortcutConflictingCallback();
      break;
    default:
      break;
  }
}

function onDialogEvents(type: string) {
  switch (type) {
    case "dialogExample":
      HelperExampleFactory.dialogExample();
      break;
    case "clipboardExample":
      HelperExampleFactory.clipboardExample();
      break;
    case "filePickerExample":
      HelperExampleFactory.filePickerExample();
      break;
    case "progressWindowExample":
      HelperExampleFactory.progressWindowExample();
      break;
    case "vtableExample":
      HelperExampleFactory.vtableExample();
      break;
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
