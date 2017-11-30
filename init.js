if (typeof window.cyInit === 'undefined') {
  window.cyInit = true;
  $ = document.querySelectorAll.bind(document);
  cyRecord = localStorage.getItem('cyRecords')
    ? JSON.parse(localStorage.getItem('cyRecords'))
    : [];
  cyRecording = localStorage.getItem('cyRecording')
    ? JSON.parse(localStorage.getItem('cyRecording'))
    : false;

  /** ********************************************************************* */
  /** **************************** Helpers ******************************** */
  /** ********************************************************************* */

  function isElement(el) {
    let isElem;

    if (typeof HTMLElement === 'object') {
      isElem = el instanceof HTMLElement;
    } else {
      isElem =
        !!el &&
        typeof el === 'object' &&
        el.nodeType === 1 &&
        typeof el.nodeName === 'string';
    }
    return isElem;
  }

  function isUnique(selector, element) {
    return (
      typeof selector === 'string' &&
      document.body.querySelectorAll(selector).length === 1 &&
      document.body.querySelectorAll(selector)[0] === element
    );
  }

  /** ********************************************************************* */
  /** ************************** Attributes ******************************* */
  /** ********************************************************************* */

  function getAttributes(el, attributesToAccept = ['data-', 'role', 'type']) {
    const { attributes } = el;
    const attrs = [...attributes];
    const attrsReduced = attrs.reduce((sum, next) => {
      attributesToAccept.forEach(attrToAccept => {
        // Perfect match or begin with data-*
        if (
          next.nodeName === attrToAccept ||
          next.nodeName.match(new RegExp(`${attrToAccept}\\w+`, 'g'))
        ) {
          sum.push(`[${next.nodeName}="${next.value}"]`);
        }
      });

      return sum;
    }, []);

    const prioritizedAttrs = attrsReduced.filter(
      attr => attr.match(/data-test-\w+/g) !== null
    );
    const otherAttrs = attrsReduced.filter(
      attr => attr.match(/data-test-\w+/g) === null
    );

    return prioritizedAttrs.concat(otherAttrs);
  }

  /** ********************************************************************* */
  /** *************************** Classes ********************************* */
  /** ********************************************************************* */
  function getClasses(el) {
    if (!el.hasAttribute('class')) {
      return [];
    }

    try {
      return Array.prototype.slice.call(el.classList);
    } catch (e) {
      let className = el.getAttribute('class');

      // remove duplicate and leading/trailing whitespaces
      className = className.trim().replace(/\s+/g, ' ');

      // split into separate classnames
      return className.split(' ');
    }
  }

  function getClassSelectors(el) {
    const classList = getClasses(el).filter(Boolean);
    return classList.map(cl => `.${cl}`);
  }

  /** ********************************************************************* */
  /** ************************** COMBINATIONS ***************************** */
  /** ********************************************************************* */

  function kCombinations(result, items, data, start, end, index, k) {
    if (index === k) {
      result.push(data.slice(0, index).join(''));
      return;
    }

    for (let i = start; i <= end && end - i + 1 >= k - index; ++i) {
      data[index] = items[i];
      kCombinations(result, items, data, i + 1, end, index + 1, k);
    }
  }

  function getCombinations(items, k) {
    const result = [],
      n = items.length,
      data = [];

    for (var l = 1; l <= k; ++l) {
      kCombinations(result, items, data, 0, n - 1, 0, l);
    }

    return result;
  }

  /** ********************************************************************* */
  /** ******************************* ID ********************************** */
  /** ********************************************************************* */

  function getID(el) {
    const id = el.getAttribute('id');

    if (id !== null && id !== '') {
      return `#${id}`;
    }
    return null;
  }

  /** ********************************************************************* */
  /** **************************** NTH-CHILD ****************************** */
  /** ********************************************************************* */

  function getNthChild(element) {
    let counter = 0;
    let k;
    let sibling;
    const { parentNode } = element;

    if (Boolean(parentNode)) {
      const { childNodes } = parentNode;
      const len = childNodes.length;
      for (k = 0; k < len; k++) {
        sibling = childNodes[k];
        if (isElement(sibling)) {
          counter++;
          if (sibling === element) {
            return `:nth-child(${counter})`;
          }
        }
      }
    }
    return null;
  }

  /** ********************************************************************* */
  /** ***************************** PARENTS ******************************* */
  /** ********************************************************************* */

  function getParents(el) {
    const parents = [];
    let currentElement = el;
    while (isElement(currentElement)) {
      parents.push(currentElement);
      currentElement = currentElement.parentNode;
    }

    return parents;
  }

  /** ********************************************************************* */
  /** ******************************* TAG ********************************* */
  /** ********************************************************************* */

  function getTag(el) {
    return el.tagName.toLowerCase().replace(/:/g, '\\:');
  }

  /** ********************************************************************* */
  /** ************************ UNIQUE-SELECTOR **************************** */
  /** ********************************************************************* */

  function getAllSelectors(el, selectors, attributesToAccept) {
    const funcs = {
      Tag: getTag,
      NthChild: getNthChild,
      Attributes: elem => getAttributes(elem, attributesToAccept),
      Class: getClassSelectors,
      ID: getID,
    };

    return selectors.reduce((res, next) => {
      res[next] = funcs[next](el);
      return res;
    }, {});
  }

  function testUniqueness(element, selector) {
    const { parentNode } = element;
    const elements = parentNode.querySelectorAll(selector);
    return elements.length === 1 && elements[0] === element;
  }

  function getFirstUnique(element, selectors) {
    return selectors.find(testUniqueness.bind(null, element));
  }

  function getUniqueCombination(element, items, tag) {
    let combinations = getCombinations(items, 3),
      firstUnique = getFirstUnique(element, combinations);

    if (Boolean(firstUnique)) {
      return firstUnique;
    }

    if (Boolean(tag)) {
      combinations = combinations.map(combination => tag + combination);
      firstUnique = getFirstUnique(element, combinations);

      if (Boolean(firstUnique)) {
        return firstUnique;
      }
    }

    return null;
  }

  function getUniqueSelector(element, selectorTypes, attributesToAccept) {
    let foundSelector;

    const elementSelectors = getAllSelectors(
      element,
      selectorTypes,
      attributesToAccept
    );

    for (let selectorType of selectorTypes) {
      const {
        ID,
        Tag,
        Class: Classes,
        Attributes,
        NthChild,
      } = elementSelectors;
      switch (selectorType) {
        case 'ID':
          if (Boolean(ID) && testUniqueness(element, ID)) {
            return ID;
          }
          break;

        case 'Tag':
          if (Boolean(Tag) && testUniqueness(element, Tag)) {
            return Tag;
          }
          break;

        case 'Class':
          if (Boolean(Classes) && Classes.length) {
            foundSelector = getUniqueCombination(element, Classes, Tag);
            if (foundSelector) {
              return foundSelector;
            }
          }
          break;

        case 'Attributes':
          if (Boolean(Attributes) && Attributes.length) {
            foundSelector = getUniqueCombination(element, Attributes, Tag);
            if (foundSelector) {
              return foundSelector;
            }
          }
          break;

        case 'NthChild':
          if (Boolean(NthChild)) {
            return NthChild;
          }
      }
    }

    return '*';
  }

  function unique(el, options = {}) {
    const {
      selectorTypes = ['ID', 'Attributes', 'Class', 'Tag', 'NthChild'],
      attributesToAccept = ['data-', 'role', 'type'],
    } = options;
    const allSelectors = [];
    const parents = getParents(el);

    for (let elem of parents) {
      const selector = getUniqueSelector(
        elem,
        selectorTypes,
        attributesToAccept
      );
      if (Boolean(selector)) {
        allSelectors.push(selector);
      }
    }

    const selectors = [];
    for (let it of allSelectors) {
      selectors.unshift(it);
      const selector = selectors.join(' > ');
      if (isUnique(selector, el)) {
        return selector;
      }
    }

    return null;
  }

  /** ********************************************************************* */
  /** *************************** RECORD EVENTS *************************** */
  /** ********************************************************************* */

  function hasRecord() {
    return cyRecord.length === 0;
  }

  function saveEvent(cyEvent) {
    // First event
    if (hasRecord()) {
      cyRecord.push({
        event: 'visit',
        value: window.location.href,
      });
    }

    cyRecord.push(cyEvent);
  }

  function isSVGChild(element) {
    return element.ownerSVGElement;
  }

  function getRealTarget(initialTarget, authorizedTags, deepTags) {
    // Check if it's a child
    if (authorizedTags.indexOf(initialTarget.tagName.toLowerCase()) < 0) {
      // Specific case for SVG children
      return isSVGChild(initialTarget)
        ? initialTarget.ownerSVGElement.parentElement
        : initialTarget.parentElement;
    }

    return initialTarget;
  }

  $('form').forEach(function(element) {
    element.addEventListener('submit', function(event) {
      if (cyRecording === false) {
        return;
      }

      var activeElement = document.activeElement;
      if (
        activeElement.tagName.toLowerCase() === 'input' &&
        activeElement.type.toLowerCase() !== 'submit'
      ) {
        if (
          activeElement.focusValue !== '' &&
          activeElement.value.split(activeElement.focusValue)[0].length === 0
        ) {
          if (activeElement.value === '') {
            saveEvent({
              event: 'clear',
              get: unique(activeElement),
            });
          } else {
            saveEvent({
              event: 'type',
              value: activeElement.value.split(activeElement.focusValue)[1],
              get: unique(activeElement),
              key: '{enter}',
            });
          }
        } else {
          saveEvent({
            event: 'clear',
            get: unique(activeElement),
          });
          saveEvent({
            event: 'type',
            value: activeElement.value,
            get: unique(activeElement),
            key: '{enter}',
          });
        }
      } else {
        saveEvent({
          event: 'submit',
          get: unique(event.target),
        });
      }
    });
  });

  $('button, button *, [type=button], a, a *, label, label *').forEach(function(
    element
  ) {
    element.addEventListener('click', function(event) {
      if (cyRecording === false) {
        return;
      }

      if (
        cyRecord.length > 0 &&
        cyRecord.slice(-1)[0].timeStamp === event.timeStamp
      ) {
        return;
      }

      var target = getRealTarget(
        event.target,
        ['button, a, label, input'],
        ['g', 'path']
      );
      var activeElement = document.activeElement;
      if (
        activeElement.tagName.toLowerCase() === 'input' &&
        target.type === 'submit'
      ) {
        // Button event is triggered by a form submission
        return;
      }
      saveEvent({
        event: 'click',
        get: unique(target),
        timeStamp: event.timeStamp,
      });
    });
  });

  $('select').forEach(function(element) {
    element.addEventListener('change', function(event) {
      if (cyRecording === false) {
        return;
      }

      event.stopPropagation();
      var target = event.target;
      saveEvent({
        event: 'select',
        get: unique(target),
        value: target.value,
      });
    });
  });

  $('[type=radio], [type=checkbox]').forEach(function(element) {
    element.addEventListener('click', function(event) {
      if (cyRecording === false) {
        return;
      }

      // Simultaneous event on label and input
      if (
        cyRecord.length > 0 &&
        cyRecord.slice(-1)[0].timeStamp === event.timeStamp
      ) {
        return;
      }

      event.stopPropagation();
      var target = event.target;
      saveEvent({
        event: target.checked ? 'check' : 'uncheck',
        get: unique(target),
      });
    });
  });

  $(
    'input[type=text], input[type=search], input[type=number], textarea'
  ).forEach(function(element) {
    element.addEventListener('focus', function(event) {
      if (cyRecording === false) {
        return;
      }

      var target = event.target;
      target.focusValue = target.value || '';
      saveEvent({
        event: 'focus',
        get: unique(target),
      });
    });

    element.addEventListener('blur', function(event) {
      if (cyRecording === false) {
        return;
      }

      event.stopPropagation();
      var target = event.target;

      // Check if the new content is typed after the potential existing content
      if (
        target.focusValue !== '' &&
        target.value.split(target.focusValue)[0].length === 0
      ) {
        if (target.value === '') {
          saveEvent({
            event: 'clear',
            get: unique(target),
          });
        } else {
          saveEvent({
            event: 'type',
            value: target.value.split(target.focusValue)[1],
            get: unique(target),
          });
        }
      } else {
        saveEvent({
          event: 'clear',
          get: unique(target),
        });
        saveEvent({
          event: 'type',
          value: target.value,
          get: unique(target),
        });
      }

      saveEvent({
        event: 'blur',
        get: unique(target),
      });
    });
  });

  window.onbeforeunload = () => {
    if (cyRecording === true && cyRecord.length > 0) {
      localStorage.setItem('cyRecords', JSON.stringify(cyRecord));
      localStorage.setItem('cyRecording', JSON.stringify(true));
    }
  };
}
