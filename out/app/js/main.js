import { store } from './store.js';

const routes = {
  '/': 'dashboard',
  '/transactions': 'transactions',
  '/budgets': 'budgets',
  '/goals': 'goals',
  '/reports': 'reports'
};

let currentState = null;

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const path = routes[hash] != null ? hash : '/';
  return path;
}

async function render() {
  const path = currentRoute();
  const name = routes[path];
  const mod = await import(`./views/${name}.js`);
  const view = document.getElementById('view');
  if (!view) return;
  view.innerHTML = mod.render(currentState);

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === `#${path}`) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function refreshState() {
  currentState = store.init();
}

window.addEventListener('hashchange', render);

refreshState();
render();
