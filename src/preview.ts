import { config } from "../package.json";

export {
  createPreviewBox,
  createPreviewButton,
  addTootip,
  previewTempStatus,
  throttle,
  openPDFAnnotation,
};
let oldElement: Element | null;
let previewStatus = false;

// const annotationListConfig = {
//   tag1: {
//     color: "#ffd400",
//     text: "黄色",
//     note: "疑问",
//   },
// };
function changePreviewIcon(status: boolean) {
  if (status == true) {
    const previewIcon = document.querySelector("#quicker-preview-icon");
    previewIcon?.setAttribute(
      "src",
      `chrome://${config.addonRef}/content/icons/preview.png`,
    );
  } else {
    const previewIcon = document.querySelector("#quicker-preview-icon");
    previewIcon?.setAttribute(
      "src",
      `chrome://${config.addonRef}/content/icons/preview_close.png`,
    );
  }
}
// 按钮切换预览功能的开关
function switchPreviewStatus() {
  if (previewStatus == false) {
    document.addEventListener("mousemove", getItemByMouseWithDebounce);
    changePreviewIcon(true);
    previewStatus = true;
  } else {
    document.removeEventListener("mousemove", getItemByMouseWithDebounce);
    changePreviewIcon(false);
    clearImg();
    previewStatus = false;
  }
}
// 为切换标签页提供的开关
function previewTempStatus(closePreview = true) {
  if (previewStatus == true && closePreview == false) {
    Zotero.log("open preview");
    document.addEventListener("mousemove", getItemByMouseWithDebounce);
  } else {
    Zotero.log("close preview");
    document.removeEventListener("mousemove", getItemByMouseWithDebounce);
    clearImg();
  }
}
function createPreviewBox() {
  const imgPreview = ztoolkit.UI.createElement(document, "div", {
    tag: "div",
    id: "imgPreviewBox",
    attributes: {
      style: `background-color:white;
        position:fixed;
        top:10px;
        left:10px;
        width:300px;
        max-height:60%;
        overflow-y:scroll;
        display:none;
        box-shadow: 2px 3px 7px #949494;
        padding:10px;
        border-radius:10px`,
    },
    children: [
      {
        tag: "img",
        id: "imgPreview",
        attributes: {
          src: "",
          style: "width: 100%; height: 100%",
        },
      },
    ],
  });
  return imgPreview;
}
function createPreviewButton() {
  const siyuanButton = {
    tag: "toolbarbutton",
    id: "quicker-preview-button",
    class: ["zotero-tb-button"],
    // namespace:"xul",
    attributes: {
      type: "button",
      tooltiptext: "为文献列表提供快速预览",
      tabindex: "-1",
    },
    listeners: [
      {
        type: "mousedown",
        listener: switchPreviewStatus,
      },
    ],
    children: [
      {
        tag: "image",
        id: "quicker-preview-icon",
        class: ["toolbarbutton-icon"],

        attributes: {
          src: `chrome://${config.addonRef}/content/icons/preview_close.png`,
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
  return siyuanButton;
}
let timeoutIdT: NodeJS.Timeout | null = null;
function throttle(callback: (event: MouseEvent) => void, delay: number) {
  let lastTimestamp = 0;

  return function (event: MouseEvent) {
    const currentTimestamp = Date.now();

    if (!lastTimestamp || currentTimestamp - lastTimestamp >= delay) {
      callback(event);
      lastTimestamp = currentTimestamp;
    } else {
      // 如果在指定时间内再次触发事件，取消之前的定时器
      if (timeoutIdT !== null) {
        clearTimeout(timeoutIdT);
      }

      // 设置一个新的定时器，延迟一段时间后执行回调
      timeoutIdT = setTimeout(() => {
        callback(event);
        lastTimestamp = currentTimestamp;
        timeoutIdT = null;
      }, delay);
    }
  };
}
let timeoutIdD: NodeJS.Timeout | null = null;
function debounce(callback: (event: MouseEvent) => void, delay: number) {
  return function (event: MouseEvent) {
    if (timeoutIdD !== null) {
      clearTimeout(timeoutIdD);
    }

    timeoutIdD = setTimeout(() => {
      callback(event);
      timeoutIdD = null;
    }, delay);
  };
}
function getItemByMouseWithDebounce(event: MouseEvent) {
  debounce(getItemByMouse, 130)(event);
}
function debounceAsync(
  asyncFunction: (event: MouseEvent) => Promise<0 | undefined>,
  delay: number,
) {
  return function (event: MouseEvent) {
    if (timeoutIdD != null) {
      Zotero.log("clear timer");
      clearTimeout(timeoutIdD);
    }
    Zotero.log("set timer");
    timeoutIdD = setTimeout(async () => {
      await asyncFunction(event);
      timeoutIdD = null;
    }, delay);
  };
}

// // 用法示例
// function handleMouseDebounced(event: MouseEvent) {
//   console.log(`Mouse event debounced: ${event.clientX}, ${event.clientY}`);
// }

// const debouncedHandler = debounce(handleMouseDebounced, 300);

// // 添加事件监听器
// document.addEventListener('mousemove', debouncedHandler);

async function openAnnotation(attachmentID: number, annotationID: number) {
  const a = await Zotero.Items.getAsync(annotationID);
  // Zotero.OpenPDF.openToPage(annotation, page, key);
  Zotero.log(a.toJSON());

  const location = {
    pageIndex: parseInt(a.annotationPageLabel),
    position: { ...JSON.parse(a.annotationPosition), paths: null },
  };
  Zotero.log(location.toString());
  await Zotero.Reader.open(attachmentID, location);
}
async function openPDFAnnotation(event: MouseEvent) {
  Zotero.log(`x:${event.pageX},y:${event.pageY}`);
  const annotationItem = document.elementFromPoint(event.pageX, event.pageY);
  Zotero.log(annotationItem?.outerHTML);
  const aidList = annotationItem?.getAttribute("id")?.split("-");
  if (aidList == undefined) {
    return;
  }
  clearImg();
  openAnnotation(parseInt(aidList[0]), parseInt(aidList[1]));
}
// 清除悬浮的图片
function clearImg() {
  const node = document.querySelector("#imgPreviewBox") as HTMLElement;
  if (node != null) {
    node.style.display = "none";
  }
}
async function getItemByMouse(e: MouseEvent) {
  const x = e.pageX;
  const y = e.pageY;
  const newElement = document.elementFromPoint(x, y);
  // Zotero.log(0.1);
  if (newElement != oldElement) {
    oldElement = newElement;
    // Zotero.log(0);
    // 如果是列表页的空白地方，则直接返回
    if (newElement?.getAttribute("class") == null) {
      return 0;
    }
    const elementClass = (newElement?.attributes as any)?.class.value as string;
    // 因为悬浮图片没有class，所以会出错返回，意外的实现了鼠标可以悬浮在图片上，后面再用一个更合适的方法实现一下
    // Zotero.log(1);
    Zotero.log(elementClass);
    if (
      elementClass != undefined &&
      elementClass?.includes("virtualized-table-body")
    ) {
      clearImg();
      Zotero.log("space area");
      return 0;
    }
    // Zotero.log(2);
    ztoolkit.log(newElement?.outerHTML);
    // const rowList = newElement?.querySelectorAll("div.row span[id=title]");
    const rowList = newElement?.querySelectorAll(".cell-text");
    // Zotero.log(3);
    if (rowList == undefined || rowList?.length < 1) {
      clearImg();
      return;
    }
    // ztoolkit.log(1);
    const title = rowList[0].textContent;
    if (title == null || title == undefined) {
      // 清除悬浮的图片
      clearImg();
      ztoolkit.log("not item");
      return;
    }
    // ztoolkit.log(2);
    Zotero.log(title);
    // 根据题目搜索条目
    const s = new Zotero.Search({ libraryID: Zotero.Libraries.userLibraryID });

    s.addCondition("title", "is", title); //
    const itemIDs = await s.search();

    if (itemIDs == undefined || itemIDs.length == 0) {
      clearImg();
      return;
    }
    ztoolkit.log(`itemID: ${itemIDs}`);
    const hoverItemID = itemIDs[0];
    if (hoverItemID == undefined) {
      clearImg();
      return;
    }
    const hoverItem = await Zotero.Items.getAsync(hoverItemID);
    // ztoolkit.log(4);
    // 获取PDF附件
    const attachmentID = hoverItem.getAttachments()[0];
    Zotero.log(`attachmentID: ${attachmentID}`);
    if (attachmentID == undefined) {
      clearImg();
      return;
    }
    Zotero.log(`attachmentID: ${attachmentID}`);
    const attachmentItem = await Zotero.Items.getAsync(attachmentID);
    // 筛选标注
    // ztoolkit.log(5);
    Zotero.log(`attachmentItem:${attachmentItem}`);
    const annotations = attachmentItem.getAnnotations();
    if (annotations == undefined || annotations.length == 0) {
      clearImg();
      return;
    }
    Zotero.log(`attachmentItem:${attachmentItem}`);
    const previewList = [];
    for (const a of annotations) {
      if (a.annotationColor == "#ff6666") {
        previewList.push(a);
      }
    }
    // 如果没有需要预览的标注
    if (previewList.length == 0) {
      clearImg();
      Zotero.log(`没有需要预览的标注`);
      return 0;
    }
    // 设置预览框属性
    const node = document.querySelector("#imgPreviewBox") as HTMLElement;
    if (node != null) {
      node.style.display = "block";
      node.style.top = y - 30 + "px";
      node.style.left = x + 10 + "px";
    }

    // 提取标注信息,todo:提取评论信息
    // 标注类型：highlight，underline，note，image
    let innerHtml = "";
    for (const a of previewList) {
      if (a.annotationType == "image") {
        // 获取图片标注的截图路径
        const imgSrc = Zotero.Annotations.getCacheImagePath({
          libraryID: a.libraryID,
          key: a.key,
        });
        // 将路径中的\ 替换为 \\
        const f = await Zotero.File.generateDataURI(
          imgSrc.replace(/\\/g, "\\\\"),
          "png",
        );

        innerHtml += `<img src="${f}" id="${attachmentID}-${
          (a as any).itemID
        }" style="width: 100%; height: 100%; margin:10px 5px 2px"/>`;

        if (a.annotationComment) {
          innerHtml += `<p>Note：${a.annotationComment}</p>`;
        }
      } else if (
        a.annotationType == ("underline" as any) ||
        a.annotationType == "highlight"
      ) {
        // 高亮型标注
        innerHtml += `<p 
        id="${attachmentID}-${(a as any).itemID}"
        style="
        margin:10px 5px 2px;
        border-left:3px green solid;
        background:#eeeeee;
        padding:5px
        ">
        ${a.annotationText}
        </p>`;

        if (a.annotationComment) {
          innerHtml += `<p>Note：${a.annotationComment}</p>`;
        }
      }
    }

    Zotero.log(innerHtml);
    node.innerHTML = innerHtml;
  }
}

function addTootip() {
  const tooltipList: { [key: string]: string } = {
    黄色: "疑问",
    红色: "重点/核心",
    绿色: "思路/启发",
    紫色: "写作/借鉴",
    灰色: "漏洞/错误",
  };
  const readerWindow = Zotero.Reader.getByTabID(
    Zotero_Tabs.selectedID,
  )._iframeWindow;
  if (readerWindow == undefined) {
    Zotero.log("readerWindow undefined");
    return 0;
  }
  const targetNode = readerWindow.document.getElementById("reader-ui");
  if (targetNode == null || targetNode == undefined) {
    Zotero.log("未发现元素：reader-ui");
    return 0;
  }

  // Zotero.log("1");
  const observer = new (readerWindow as any).MutationObserver(function (
    mutationsList: MutationRecord[],
    observer: MutationObserver,
  ) {
    // 迭代所有的变更记录
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        Zotero.log(`元素的子节点发生了变化`);
        const changedNode = mutation.addedNodes[0];
        const colorButtons =
          readerWindow.document.querySelectorAll("button.row.basic");
        if (colorButtons == undefined) {
          return;
        }
        for (const button of colorButtons) {
          if (
            button.textContent != null &&
            Object.keys(tooltipList).includes(button.textContent)
          ) {
            Zotero.log(button.textContent);
            Zotero.log(button.innerHTML);
            button.innerHTML =
              button.innerHTML + "【" + tooltipList[button.textContent] + "】";
            Zotero.log(button.innerHTML);
          }
        }
      }
    }
  });
  // Zotero.log("hello2");
  observer.observe(targetNode, { childList: true });
  return observer;
}
