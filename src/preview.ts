import { config } from "../package.json";

export { createPreviewBox, createPreviewButton };
let oldElement: Element | null;
let previewStatus = false;
function createPreviewBox() {
  const imgPreview = ztoolkit.UI.createElement(document, "div", {
    tag: "div",
    id: "imgPreviewBox",
    attributes: {
      style:
        "background-color:green;position:fixed;top:10px;left:10px;width:300px;display:none",
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
        listener: () => {
          if (previewStatus == false) {
            document.addEventListener("mousemove", getItemByMouse);
            previewStatus = true;
          } else {
            document.removeEventListener("mousemove", getItemByMouse);
            previewStatus = false;
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
          src: `chrome://${config.addonRef}/content/icons/favicon.png`,
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
function clearImg() {
  // 清除悬浮的图片
  const node = document.querySelector("#imgPreviewBox") as HTMLElement;
  if (node != null) {
    node.style.display = "none";
  }
}
async function getItemByMouse(e: MouseEvent) {
  const x = e.pageX;
  const y = e.pageY;
  const newElement = document.elementFromPoint(x, y);
  if (newElement != oldElement) {
    oldElement = newElement;
    // console.log(newElement?.outerHTML);
    const rowList = newElement?.querySelectorAll(".cell-text");
    if (rowList == undefined || rowList?.length > 1) {
      clearImg();
      return;
    }
    ztoolkit.log(1);
    const title = rowList[0].textContent;
    if (title == null || title == undefined) {
      // 清除悬浮的图片
      clearImg();
      ztoolkit.log("not item");
      return;
    }
    ztoolkit.log(2);
    ztoolkit.log(title);
    // 根据题目搜索条目
    const s = new Zotero.Search({ libraryID: Zotero.Libraries.userLibraryID });

    s.addCondition("title", "is", title); //
    const itemIDs = await s.search();
    if (itemIDs == undefined || itemIDs.length == 0) {
      clearImg();
      return;
    }
    ztoolkit.log(3);
    const hoverItemID = itemIDs[0];
    if (hoverItemID == undefined) {
      clearImg();
      return;
    }
    const hoverItem = await Zotero.Items.getAsync(hoverItemID);
    ztoolkit.log(4);
    // 获取PDF附件
    const attachmentID = hoverItem.getAttachments()[0];

    if (attachmentID == undefined) {
      clearImg();
      return;
    }
    const attachmentItem = await Zotero.Items.getAsync(attachmentID);
    // 筛选标注
    ztoolkit.log(5);
    const annotation = attachmentItem.getAnnotations()[0];
    if (annotation == undefined) {
      clearImg();
      return;
    }
    // ----------------
    ztoolkit.log(hoverItem, attachmentItem, annotation);
    const imgSrc = Zotero.Annotations.getCacheImagePath({
      libraryID: annotation.libraryID,
      key: annotation.key,
    });
    ztoolkit.log(6);
    const node = document.querySelector("#imgPreviewBox") as HTMLElement;
    const imgNode = document.querySelector("#imgPreview") as HTMLElement;
    if (node != null && imgNode != null) {
      node.style.display = "block";
      node.style.top = y + 20 + "px";
      node.style.left = x + 10 + "px";
      const f = await Zotero.File.generateDataURI(
        imgSrc.replace(/\\/g, "\\\\"),
        "png",
      );
      imgNode.setAttribute("src", f);
    }
    ztoolkit.log(imgSrc);
  }
}
