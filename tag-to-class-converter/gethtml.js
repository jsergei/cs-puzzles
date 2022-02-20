// This script is run after ready_to_print and gets the HTML for the current page DOM
async function getHtmlConverter (printMedia) {
    const REMOVED_TAG_PREFIX = 'x-cwi-';
    let removedTags = {};
    let removedAttributes = {};
    let usedClasses = {};
    let usedElements = { '*': true };
    let resources = {};

    function cleanNodes(node) {
        /**
         * Determines if the attribute is acceptable in iXBRL
         * @param {Element} node
         * @param {string} attribute
         * @return {boolean}
         */
        function isAttributeInvalid(node, attribute) {
            // All element attributes.
            if (
                attribute.startsWith('ng-') ||
                attribute.startsWith('i18n-') || // SE-17369
                attribute.startsWith('_ngcontent_') ||
                attribute.startsWith('_ngcontent-') ||
                attribute.startsWith('vspace') ||
                attribute.startsWith('hspace') ||
                attribute.startsWith('border') || // SE-18090
                attribute.startsWith('note') ||
                attribute.startsWith('note-reference') || // SE-14099
                attribute.startsWith('auto-id') ||
                attribute.startsWith('created-by')
            ) {
                return true;
            }

            // Only attributes on span elements.
            if (node.nodeName.toUpperCase() === 'SPAN') {
                // Remove all formula attributes
                if (attribute.startsWith('type') || attribute.startsWith('formula') || attribute.startsWith('paste-data')) {
                    return true; // SE-17203, SE-18016
                }

                // Remove all placeholder attributes
                if (
                    attribute.startsWith('placeholder') ||
                    attribute.startsWith('custom-label') ||
                    attribute.startsWith('title') ||
                    attribute.startsWith('has-body')
                ) {
                    return true; // SE-18090
                }
            }

            return false;
        }

        /**
         * Convert _nghost-ydt-c336 and _ngcontent-gan-c126 attributes into classes with prefixes
         * @param {Element} node
         */
        function convertNgAttributesIntoClasses(node) {
            let attributes = node.getAttributeNames();
            for (let attribute of attributes) {
                if (attribute.startsWith('_nghost-') || attribute.startsWith('_ngcontent-')) {
                    removedAttributes[attribute] = true;
                    node.removeAttribute(attribute);
                    node.classList.add(REMOVED_TAG_PREFIX + attribute);
                }
            }
        }

        /**
         * Removes attributes that don't belong on a node according to iXBRL requirements.
         * @param {Element} node
         */
        function removeInvalidAttributes(node) {
            let attributes = node.getAttributeNames();
            for (let i = 0; i < attributes.length; i++) {
                if (isAttributeInvalid(node, attributes[i])) {
                    node.removeAttribute(attributes[i]);
                } else if (attributes[i] === 'class') {
                    node.classList.forEach((cls) => {
                        if (cls === 'ng-hide') {
                            node.parentNode.removeChild(node);
                        }
                        if (cls.startsWith('ng-')) {
                            node.classList.remove(cls);
                        }
                    });
                    if (node.classList.length === 0) node.removeAttribute('class');
                }
            }
        }

        /**
         * Adds any manditory elements as required by iXBRL.
         * @param {Element} node
         */
        function addMissingAttributes(node) {
            // For img nodes ensure that the alt attribute is present.
            if (node.nodeName.toUpperCase() === 'IMG') {
                // SE-18090
                if (!node.getAttribute('alt')) {
                    node.setAttribute('alt', 'image');
                }
            }
        }

        /**
         * Removes the visibility line bullets that appear in text areas. This widget should never be in the final
         * output but is appearing in the final iXBRL document.
         * @param {Element} node
         */
        function removeVisibilityEyeIcon(node) {
            // SE-18090
            if (node.nodeName.toUpperCase() === 'LI' && node.classList.contains('visibility')) {
                // We are inside a visibility bulleted list in this element type all direct children that are img
                // with class visibility are invalid.
                for (let i = 0; i < node.children.length; i++) {
                    if (node.children[i].nodeName.toUpperCase() === 'IMG' && node.children[i].classList.contains('visibility')) {
                        node.removeChild(node.children[i]);
                        i--;
                    }
                }

                if (node.hasAttribute('visibility')) {
                    node.removeAttribute('visibility');
                }
            }
        }

        if (!node || !node.parentNode) return;

        if (node.nodeType === Node.COMMENT_NODE) {
            node.parentNode.removeChild(node);
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            convertNgAttributesIntoClasses(node);

            // Remove unknown tags or tags with - characters in them
            if (node instanceof HTMLUnknownElement || node.localName.includes('-')) {
                removedTags[node.localName] = true;
                const range = document.createRange();
                const replaceElement = document.createElement('div');
                const replaceClass = node.getAttribute('class');
                replaceElement.setAttribute(
                    'class',
                    REMOVED_TAG_PREFIX + node.localName + (replaceClass ? ' ' + replaceClass : '')
                );
                range.selectNodeContents(node);
                replaceElement.appendChild(range.extractContents());
                node.parentNode.replaceChild(replaceElement, node);
                node = replaceElement;
            }

            // Remove invalid ixbrl attributes
            removeInvalidAttributes(node);

            // Add an title attribute if one is not present for images
            addMissingAttributes(node);

            // For visibility bullets the eye icon was inserted into the HTML in specific situations this is not
            // being removed and cleaned up for img tags marked as visibility the entire element should be removed.
            removeVisibilityEyeIcon(node);
        }

        for (let c = node.firstChild; c; ) {
            let n = c.nextSibling;
            cleanNodes(c);
            c = n;
        }
    }

    async function convertCSSSheetToStyle(sheet) {
        if (!sheet) return '';
        let styleBody = '';
        styleBody += await convertCSSRulesToStyle(sheet.cssRules);
        return styleBody;
    }

    async function convertCSSRulesToStyle(rules) {
        let styleBody = '';
        for (const rule of rules) {
            styleBody += (await inlineCSSResources(rule)).cssText + '\r\n';
        }
        return styleBody;
    }

    async function inlineCSSResources(rule) {
        if (rule.styleMap) {
            for (const [prop, val] of rule.styleMap) {
                if (val instanceof Array && val[0] instanceof CSSImageValue) {
                    const url = val[0].toString();
                    const image = await getResource(url.substring(5, url.length - 2));
                    rule.styleMap.set(prop, 'url(' + image + ')');
                }
            }
        }
        return rule;
    }

    function getResource(url) {
        return new Promise((resolve, reject) => {
            if (url.indexOf(':') === -1 || url.startsWith(window.location.origin)) {
                if (resources.hasOwnProperty(url)) {
                    resolve(resources[url]);
                } else {
                    const req = new XMLHttpRequest();
                    req.open('GET', url);
                    req.responseType = 'blob';
                    req.onload = () => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resources[url] = reader.result;
                            resolve(resources[url]);
                        };
                        reader.onerror = () => {
                            reject();
                        };
                        reader.readAsDataURL(req.response);
                    };
                    req.onerror = () => {
                        reject();
                    };
                    req.send();
                }
            } else {
                resolve(url);
            }
        });
    }

    function cleanCSSRule(rule) {
        if (rule.cssRules) {
            for (let i = 0; i < rule.cssRules.length; i++) {
                const cleanRule = cleanCSSRule(rule.cssRules[i]);
                if (!cleanRule) {
                    rule.deleteRule(i);
                    i--;
                } else if (cleanRule.media && cleanRule.media.length === 0) {
                    for (let j = 0; j < cleanRule.cssRules.length; j++) {
                        rule.insertRule(cleanRule.cssRules[j].cssText, i + j + 1);
                    }
                    rule.deleteRule(i);
                    i += cleanRule.cssRules.length - 1;
                }
            }
        }
        if (printMedia && rule.media) {
            for (let i = 0; i < rule.media.length; i++) {
                if (rule.media[i] === 'print') {
                    rule.media.deleteMedium('print');
                } else if (rule.media[i] === 'screen' && rule.media.length === 1) {
                    return null;
                }
            }
        }
        if (rule.selectorText) {
            let segments = rule.selectorText.split(',');
            for (let i = 0; i < segments.length; i++) {
                let parts = segments[i].split(' ');
                for (let j = 0; j < parts.length; j++) {
                    parts[j] = convertSelectorAttrToCls(parts[j]);
                    const selector = parseSelector(parts[j]);
                    if (selector.el && removedTags[selector.el]) {
                        parts[j] = '.' + REMOVED_TAG_PREFIX + selector.el + (selector.cls ? ' .' + selector.cls : '');
                    }
                }
                segments[i] = parts.join(' ');
            }
            rule.selectorText = segments.join(',');
        }
        return rule;
    }

    function removeUnusedCSSRule(rule) {
        if (rule.cssRules) {
            for (let i = 0; i < rule.cssRules.length; i++) {
                if (!removeUnusedCSSRule(rule.cssRules[i])) {
                    rule.deleteRule(i);
                    i--;
                }
            }
            if (rule.cssRules.length === 0) return null;
        }
        if (rule.selectorText) {
            let segments = rule.selectorText.split(',');
            for (let i = 0; i < segments.length; i++) {
                let parts = segments[i].split(' ');
                for (let j = 0; j < parts.length; j++) {
                    let remove = false;
                    const selector = parseSelector(parts[j]);
                    if (selector.cls) {
                        for (const cls of selector.cls) {
                            if (!usedClasses[cls]) remove = true;
                        }
                    }
                    if (selector.el && !usedElements[selector.el]) {
                        remove = true;
                    }
                    if (remove) {
                        segments.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
            if (segments.length === 0) return null;
            else rule.selectorText = segments.join(',');
        }
        return rule;
    }

    /**
     * Takes a selector like this: '.hello[attr-1][attr-2] .world[attr_tt-c123]:not(.car)'
     * and transforms it into '.hello.attr-1.attr-2 .world.attr_tt-c123:not(.car)'
     * @param {string} selector
     */
    function convertSelectorAttrToCls(selector) {
        return selector.replace(/\[((?:\w|[\-])+)\]/g, function(match, attrName) {
            if (removedAttributes[attrName]) {
                return `.${REMOVED_TAG_PREFIX}${attrName}`;
            } else {
                return match;
            }
        });
    }

    function parseSelector(selector) {
        const attributesAndIds = selector.search(/[\[#:+>]/i);
        const remainder = attributesAndIds === -1 ? selector : selector.substring(0, attributesAndIds);
        const classSep = remainder.indexOf('.');
        let ret = {};
        if (classSep !== -1) {
            if (classSep !== 0) ret.el = remainder.substring(0, classSep);
            ret.cls = remainder.substring(classSep + 1).split(/(?<!\\)\./);
            for (let i = 0; i < ret.cls.length; i++) {
                if (ret.cls[i].indexOf('\\.') !== -1) ret.cls[i] = ret.cls[i].replace(/\\./g, '.');
            }
        } else {
            if (remainder) ret.el = remainder;
        }
        return ret;
    }

    async function inlineImages(element) {
        let src = element.getAttribute('src');
        if (src) element.setAttribute('src', await getResource(src));

        if (element.localName === 'link' && element.getAttribute('rel') === 'icon') {
            let href = element.getAttribute('href');
            if (href) element.setAttribute('href', await getResource(href));
        }
    }

    // Remove nv-root, which has some user menu items
    for (let nvRoot of document.querySelectorAll('nv-root')) {
        nvRoot.remove();
    }

    // Remove comments, angular hidden nodes and convert angular tags to divs with classes
    cleanNodes(document.documentElement);

    // Remove scripts
    Array.prototype.slice.call(document.getElementsByTagName('script')).forEach((item) => item.remove());

    // Convert angular tag styles to class stlyes, remove @media screen and promote @media print to be for all media
    Array.prototype.slice.call(document.styleSheets).forEach((sheet) => {
        if (!cleanCSSRule(sheet)) sheet.remove();
    });

    // Remove all elements that are hidden using display: none
    Array.prototype.slice.call(document.body.getElementsByTagName('*')).forEach((item) => {
        const tagName = item.tagName.toLowerCase();
        if (tagName !== 'style' && tagName !== 'link') {
            if (window.getComputedStyle(item).display === 'none') item.remove();
        }
    });

    // Traverse the remaining elements tracking the used elements and classes, as well as inlining the images
    for (const item of Array.prototype.slice.call(document.getElementsByTagName('*'))) {
        let classes = item.getAttribute('class');
        if (classes) classes.split(' ').forEach((cls) => (usedClasses[cls] = true));
        usedElements[item.localName] = true;
        await inlineImages(item);
    }

    // Remove all unused styles and move the remainder into one block, deleting the <link> and <style> elements that contain them
    let globalStyle = '';
    for (let x = 0; x < document.styleSheets.length; x++) {
        let sheet = document.styleSheets[x];
        globalStyle += await convertCSSSheetToStyle(removeUnusedCSSRule(sheet));
    }
    Array.prototype.slice.call(document.getElementsByTagName('style')).forEach((item) => item.remove());
    Array.prototype.slice.call(document.getElementsByTagName('link')).forEach((item) => {
        if (item.sheet) item.remove();
    });
    const inlineStyle = document.createElement('style');
    inlineStyle.setAttribute('type', 'text/css');
    inlineStyle.innerHTML = globalStyle;
    document.head.insertBefore(inlineStyle, null);

    // Return the HTML for the document
    return document.documentElement.outerHTML;
}
