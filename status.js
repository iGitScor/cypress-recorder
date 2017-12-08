function prependTestcase(trace) {
  trace.push(`  describe('Cypress recorder tests', () => {
    context('Automatic generated test (${new Date().toISOString()})', () => {
      before(() => {
        Cypress.Cookies.debug(true)
      })`);
}

function appendTestcase(trace) {
  trace.push(`
    })
  })`);
}

function beginTest(trace) {
  trace.push(`
      it('should works', () => {`);

  const routes = cyRecord.filter(record => record.route);
  console.log(routes);
  if (routes.length > 0) {
    trace.push(`
        cy.server()`);
    routes.forEach(routeObject => {
      trace.push(`
        cy.route('${routeObject.route.method.toUpperCase()}', new RegExp('${
        routeObject.route.url
      }', 'g')).as('${routeObject.route.alias}')`);
    });
  }
}

function endTest(trace) {
  trace.push(`      })`);
}

function displayTest(s, record) {
  if (typeof record.get === 'undefined') {
    switch (record.get) {
      case 'wait':
        s.push(`
        cy.${record.event}('${record.value}').then((xhr) => {
          <span class="comment">// Check that the Ajax call is well executed</span>
          expect(xhr.status).to.be.gte(200)
          expect(xhr.status).to.be.lt(400)
        })`);
        break;

      default:
        s.push(`
        cy.${record.event}('${record.value}')`);
        break;
    }
  } else {
    s.push(`
        cy.get('${record.get}')${
      record.get.indexOf('>') > 0
        ? ' <span class="comment">// Add a marker for a better selector</span>'
        : ''
    }
          .${record.event}(${
      record.value ? "'" + record.value + (record.key || '') + "'" : ''
    })`);
  }
}

if (cyRecord.length > 0) {
  var code = [];
  prependTestcase(code);
  beginTest(code);
  cyRecord.forEach(function(record) {
    displayTest(code, record);
  });
  endTest(code);
  appendTestcase(code);

  var div = document.createElement('div');
  div.id = 'cyRecorder';
  div.innerHTML = `<small>Double click to close</small><pre><code contenteditable>${code.join(
    '<br />'
  )}</code></pre>`;
  var style = document.createElement('style');
  style.id = 'cyRecorderStyle';
  style.innerHTML =
    '#cyRecorder { display: block; position: fixed; z-index: 999999999; top: 5px; left: 5px; bottom: 5px; right: 5px; margin: 0px; padding: 10px; color: #333; border: none; background: rgba(255, 255, 255, 0.95); overflow: auto; font-family: sans-serif; box-shadow: 0px 0px 10px black; } #cyRecorder code { display: block; background: #333; color: #efe54e; padding: 8px; font-size: 13px; } #cyRecorder code .comment { color: white; font-size: 12px; font-style: italic; }';

  document.body.appendChild(div);
  document.body.appendChild(style);
  document
    .getElementById('cyRecorder')
    .addEventListener('dblclick', function(event) {
      var target = event.target;
      var targetStyleDOMElement = document.getElementById('cyRecorderStyle');
      target.parentNode.removeChild(target);
      targetStyleDOMElement.parentNode.removeChild(targetStyleDOMElement);
    });
}
