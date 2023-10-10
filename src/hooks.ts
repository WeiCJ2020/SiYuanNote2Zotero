import { config } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import {
  BasicExampleFactory,
  HelperExampleFactory,
  KeyExampleFactory,
  PromptExampleFactory,
  UIExampleFactory,
} from "./modules/examples";
import {
  createPreviewBox,
  createPreviewButton,
  addTootip,
  previewTempStatus,
  throttle,
  openPDFAnnotation,
} from "./preview";

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
  // 在Zotero的主界面的Toolbar中添加一个思源笔记的按钮

  const siyuanButton = {
    tag: "toolbarbutton",
    id: "siyuan-note",
    class: ["zotero-tb-button"],
    // namespace:"xul",
    attributes: {
      type: "button",
      tooltiptext: "SiYuan Note",
      tabindex: "-1",
    },
    listeners: [
      {
        type: "mousedown",
        listener: async () => {
          const pannel = Zotero.getActiveZoteroPane();
          const item = pannel.getSelectedItems()[0];
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
          const siyuanLink = item.getField("extra");
          if (
            typeof siyuanLink == "string" &&
            siyuanLink.startsWith("siyuan://blocks")
          ) {
            Zotero.launchURL(siyuanLink);
          } else {
            // 创建思源笔记的页面
            //
            const itemID = item.key;
            ztoolkit.log(item.toJSON());

            if (item.isAttachment()) {
              return 0;
            }
            const Url = "http://127.0.0.1:6806/api/filetree/createDocWithMd";
            const data = {
              notebook: "20230628150451-27spa4f",
              path: `/Read/${item.getField("title")}`,
              // todo:根据不同类型进行判断，如果字段为空则不输出
              markdown: `Journal：${item.getField("publicationTitle")}

DOI：${item.getField("DOI")}
              
Date：${item.getField("date")}
              
Abstract：${item.getField("abstractNote")}

---
              `,
            };
            ztoolkit.log(data);
            const otherPram = {
              headers: {
                Authorization: "Token sp5ggbzogpq1hrla",
                Content_Type: "application/json",
              },
              body: JSON.stringify(data),
              method: "POST",
            };
            const res = await Zotero.HTTP.request("POST", Url, {
              headers: {
                "Content-Type": "application/json",
                Authorization: "Token sp5ggbzogpq1hrla",
              },
              body: JSON.stringify(data),
              // credentials: "include"
            });
            if (res.status == 200) {
              Zotero.launchURL(
                `siyuan://blocks/${JSON.parse(res.response).data}`,
              );
              item.setField(
                "extra",
                `siyuan://blocks/${JSON.parse(res.response).data}`,
              );
              ztoolkit.log(res.response);
            } else {
              // window.alert("error" + res.status)
              console.log(`post ${Url} error`, res);
            }

            // -----------end--------------
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
    ztoolkit.UI.insertElementBefore(createPreviewButton(), node);
  }

  document.documentElement.appendChild(createPreviewBox());
  const node2 = document.querySelector("#imgPreviewBox") as HTMLElement;
  node2.addEventListener("click", throttle(openPDFAnnotation, 1000));
}
function registerMenu2(syurl: string) {
  // 构建一个HTMLElement对象
  const siyuanButton = {
    tag: "a",
    id: "siyuan-note-icon-reader",
    classList: ["toolbarbutton-icon"],

    attributes: {
      href: syurl,
    },
    children: [
      {
        tag: "span",
        classList: ["button-background"],
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
      },
    ],
  };
  // 获取pdf阅读界面的窗口对象
  const a = Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)._iframeWindow;
  ztoolkit.log("123:", a);
  if (a == undefined) return;
  // PDF阅读界面的那个大按钮
  const node = a.document.querySelector("#viewFind");
  ztoolkit.log("456:", node);
  if (node != null) {
    // 添加一个跳转到思源笔记的按钮
    // let newscript = a.document.createElement("script")
    ztoolkit.UI.insertElementBefore(siyuanButton, node);
  }
}
async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
  // registerMenu();
  await Promise.all([registerMenu()]);
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();

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
  // 当打开pdf的时候，添加跳转按钮
  if (event == "add" && type == "tab") {
    Zotero.log("add tab");
    // BasicExampleFactory.exampleNotifierCallback();
    await Zotero.Promise.delay(1000);

    // 获取填写在“其它”字段的思源笔记链接
    const siyuanLink = Zotero.Reader.getByTabID(
      Zotero_Tabs.selectedID,
    )._item.parentItem?.getField("extra");
    if (
      typeof siyuanLink == "string" &&
      siyuanLink.startsWith("siyuan://blocks")
    ) {
      // PDF的窗口中和zotero的主窗口内容是隔离的，所以将链接传进去
      registerMenu2(siyuanLink);
    }
    Zotero.log("modify tooltip");
    // 修改标注颜色的备注
    addTootip();
    // 临时关闭预览功能

    previewTempStatus(true);
    //
  } else if (event == "close" && type == "tab") {
    previewTempStatus(false);
  }
  // 开启预览功能
  else if (event == "select" && type == "tab" && ids[0] == "zotero-pane") {
    previewTempStatus(false);
  } else {
    // 临时关闭预览功能
    previewTempStatus(true);
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
  // switch (type) {
  //   case "larger":
  //     KeyExampleFactory.exampleShortcutLargerCallback();
  //     break;
  //   case "smaller":
  //     KeyExampleFactory.exampleShortcutSmallerCallback();
  //     break;
  //   case "confliction":
  //     KeyExampleFactory.exampleShortcutConflictingCallback();
  //     break;
  //   default:
  //     break;
  // }
}

function onDialogEvents(type: string) {
  switch (type) {
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
