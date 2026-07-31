/* Shared blog behaviour: color-theme toggle, persisted in localStorage.
   Matches the toggle on index.html / docs.html so the choice carries across. */
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('ais-theme'); } catch (e) {}
  if (saved) { root.setAttribute('data-theme', saved); }
  var btn = document.getElementById('theme');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme');
    if (!cur) { cur = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ais-theme', next); } catch (e) {}
  });
})();
