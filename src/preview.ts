import { config } from "../package.json";

export { createPreviewBox, createPreviewButton, addTootip, previewTempStatus };
let oldElement: Element | null;
let previewStatus = false;

const annotationListConfig = {
  tag1: {
    color: "#ffd400",
    text: "黄色",
    note: "疑问",
  },
};
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
    document.addEventListener("mousemove", getItemByMouse);
    changePreviewIcon(true);
    previewStatus = true;
  } else {
    document.removeEventListener("mousemove", getItemByMouse);
    changePreviewIcon(false);
    clearImg();
    previewStatus = false;
  }
}
// 为切换标签页提供的开关
function previewTempStatus(closePreview = true) {
  if (previewStatus == true && closePreview == false) {
    Zotero.log("open preview");
    document.addEventListener("mousemove", getItemByMouse);
  } else {
    Zotero.log("close preview");
    document.removeEventListener("mousemove", getItemByMouse);
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
  // Zotero.log(newElement?.innerHTML);
  if (newElement != oldElement) {
    oldElement = newElement;
    // console.log(newElement?.outerHTML);
    const rowList = newElement?.querySelectorAll(".cell-text");
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
    ztoolkit.log(title);
    // 根据题目搜索条目
    const s = new Zotero.Search({ libraryID: Zotero.Libraries.userLibraryID });

    s.addCondition("title", "is", title); //
    const itemIDs = await s.search();
    if (itemIDs == undefined || itemIDs.length == 0) {
      clearImg();
      return;
    }
    // ztoolkit.log(3);
    const hoverItemID = itemIDs[0];
    if (hoverItemID == undefined) {
      clearImg();
      return;
    }
    const hoverItem = await Zotero.Items.getAsync(hoverItemID);
    // ztoolkit.log(4);
    // 获取PDF附件
    const attachmentID = hoverItem.getAttachments()[0];

    if (attachmentID == undefined) {
      clearImg();
      return;
    }
    const attachmentItem = await Zotero.Items.getAsync(attachmentID);
    // 筛选标注
    // ztoolkit.log(5);
    const annotations = attachmentItem.getAnnotations();
    if (annotations == undefined || annotations.length == 0) {
      clearImg();
      return;
    }
    const previewList = [];
    for (const a of annotations) {
      if (a.annotationColor == "#f19837") {
        previewList.push(a);
      }
    }
    // 如果没有需要预览的标注
    if (previewList.length == 0) {
      return 0;
    }
    // 设置预览框属性
    const node = document.querySelector("#imgPreviewBox") as HTMLElement;
    if (node != null) {
      node.style.display = "block";
      node.style.top = y - 20 + "px";
      node.style.left = x + 50 + "px";
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
        innerHtml += `<img src="${f}" style="width: 100%; height: 100%; margin:10px 5px 2px"/>`;
        if (a.annotationComment) {
          innerHtml += `<p>Note：${a.annotationComment}</p>`;
        }
      } else if (
        a.annotationType == ("underline" as any) ||
        a.annotationType == "highlight"
      ) {
        // 高亮型标注
        innerHtml += `<p style="
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

    node.innerHTML = innerHtml;
    // ----------------
    // ztoolkit.log(hoverItem, attachmentItem, innerHtml);
    // const imgSrc = Zotero.Annotations.getCacheImagePath({
    //   libraryID: annotation.libraryID,
    //   key: annotation.key,
    // });

    // ztoolkit.log(6);

    // const imgNode = document.querySelector("#imgPreview") as HTMLElement;
    // if (node != null && imgNode != null) {
    //   node.style.display = "block";
    //   node.style.top = y + 20 + "px";
    //   node.style.left = x + 10 + "px";
    //   const f = await Zotero.File.generateDataURI(
    //     imgSrc.replace(/\\/g, "\\\\"),
    //     "png",
    //   );
    //   imgNode.setAttribute("src", f);
    // }
    // ztoolkit.log(imgSrc);
  }
}

function addTootip() {
  const tooltipList: { [key: string]: string } = {
    黄色: "疑问",
    橘色: "重点",
  };
  const readerWindow = Zotero.Reader.getByTabID(
    Zotero_Tabs.selectedID,
  )._iframeWindow;
  if (readerWindow == undefined) {
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
