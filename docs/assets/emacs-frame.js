// * Update buffer scroll percentage

document.querySelector(".content").addEventListener("scroll", function () {
    var scrollTop = this.scrollTop;
    var scrollHeight = this.scrollHeight - this.clientHeight;
    var scrollPercent = (scrollTop / scrollHeight) * 100;
    document.getElementById("buffer-percent").textContent =
        scrollPercent === 0 ? "Top" : scrollPercent.toFixed(0) + "%";
});

// * Update buffer line number

const editor = document.querySelector(".content");
const lineNumberDisplay = document.getElementById("buffer-line-number");

editor.addEventListener("keyup", updateLineNumber);
editor.addEventListener("click", updateLineNumber);
function updateLineNumber() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();

    preCaretRange.selectNodeContents(editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    const content = preCaretRange.toString();
    const lines = content.split("\n");

    const lineNumber = lines.length;
    lineNumberDisplay.textContent = lineNumber + "L";
}

// * Table of Contents

// Select all elements with classes starting with 'outline-'
const outlineElements = document.querySelectorAll('[class^="outline-"]');
const tocList = document.getElementById("toc-list");
const toc = document.getElementById("toc");
const toggleBtn = document.getElementById("toggle-btn");

outlineElements.forEach((element) => {
    // Extract the level from the class
    const className = Array.from(element.classList).find((cls) =>
        cls.startsWith("outline-"),
    );
    const levelMatch = className.match(/outline-(\d+)-/);

    if (levelMatch) {
        const level = levelMatch[1];
        const listItem = document.createElement("li");
        listItem.className = `toc-level-${level}`;
        listItem.textContent = element.textContent;

        // Add click event to scroll to the target element
        listItem.addEventListener("click", () => {
            element.scrollIntoView({ behavior: "smooth" });
        });

        tocList.appendChild(listItem);
    }
});

toggleBtn.addEventListener("click", () => {
    if (tocList.style.display === "none") {
        tocList.style.display = "block";
    } else {
        tocList.style.display = "none";
    }
});

// * HTMLFONTIFY JS

// This is simply taken from htmlfontify.el

function hasClass(obj) {
    var result = false;
    if (obj.getAttributeNode("class") != null) {
        result = obj.getAttributeNode("class").value;
    }
    return result;
}

function stripe(id) {
    // the flag we'll use to keep track of
    // whether the current row is odd or even
    var even = false;

    // if arguments are provided to specify the colors
    // of the even & odd rows, then use them;
    // otherwise use the following defaults:
    var evenColor = arguments[1] ? arguments[1] : "#fff";
    var oddColor = arguments[2] ? arguments[2] : "#ddd";

    // obtain a reference to the desired table
    // if no such table exists, abort
    var table = document.getElementById(id);
    if (!table) {
        return;
    }

    // by definition, tables can have more than one tbody
    // element, so we'll have to get the list of child
    // &lt;tbody&gt;s
    var tbodies = table.getElementsByTagName("tbody");

    // and iterate through them...
    for (var h = 0; h < tbodies.length; h++) {
        // find all the &lt;tr&gt; elements...
        var trs = tbodies[h].getElementsByTagName("tr");

        // ... and iterate through them
        for (var i = 0; i < trs.length; i++) {
            // avoid rows that have a class attribute
            // or backgroundColor style
            if (!hasClass(trs[i]) && !trs[i].style.backgroundColor) {
                // get all the cells in this row...
                var tds = trs[i].getElementsByTagName("td");

                // and iterate through them...
                for (var j = 0; j < tds.length; j++) {
                    var mytd = tds[j];

                    // avoid cells that have a class attribute
                    // or backgroundColor style
                    if (!hasClass(mytd) && !mytd.style.backgroundColor) {
                        mytd.style.backgroundColor = even
                            ? evenColor
                            : oddColor;
                    }
                }
            }
            // flip from odd to even, or vice-versa
            even = !even;
        }
    }
}

function toggle_invis(name) {
    var filter = {
        acceptNode: function (node) {
            var classname = node.id;
            if (classname) {
                var classbase = classname.substr(0, name.length);
                if (classbase == name) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
            return NodeFilter.FILTER_SKIP;
        },
    };
    var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        filter,
        false,
    );
    while (walker.nextNode()) {
        var e = walker.currentNode;
        if (e.style.display == "none") {
            e.style.display = "inline";
        } else {
            e.style.display = "none";
        }
    }
}
