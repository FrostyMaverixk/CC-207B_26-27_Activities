(function(){
  var root=document.documentElement, themeBtn=document.getElementById('theme');
  function isDark(){
    var t=root.getAttribute('data-theme');
    if(t) return t==='dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function label(){ themeBtn.textContent=isDark()?'Light':'Dark'; }
  try{ var saved=localStorage.getItem('theme'); if(saved) root.setAttribute('data-theme',saved); }catch(e){}
  label();
  themeBtn.addEventListener('click',function(){
    var next=isDark()?'light':'dark';
    root.setAttribute('data-theme',next);
    try{ localStorage.setItem('theme',next); }catch(e){}
    label();
  });

  var buttons=document.querySelectorAll('.filter-btn');
  var items=document.querySelectorAll('.project-row');

  buttons.forEach(function(button){
    button.addEventListener('click',function(){
      var filterValue = button.dataset.filter || 'all';

      buttons.forEach(function(item){
        var isActive = item === button;
        item.setAttribute('aria-pressed', String(isActive));
        item.classList.toggle('is-active', isActive);
      });

      items.forEach(function(project){
        var cats = (project.dataset.cat || '').trim().split(/\s+/).filter(Boolean);
        var show = filterValue === 'all' || cats.indexOf(filterValue) !== -1;

        project.hidden = !show;
        project.style.display = show ? '' : 'none';
      });
    });
  });

  var status=document.getElementById('status');
  document.getElementById('copy').addEventListener('click',function(){
    var addr='Kennethmacrene.anas@wvsu.edu.ph';
    function done(msg){ status.textContent=msg; setTimeout(function(){status.textContent='';},2500); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(addr).then(function(){done('Email copied');},function(){done(addr);});
    } else { done(addr); }
  });

  var scrollBtn=document.getElementById('scrollTop');
  function toggleScrollButton(){
    if(!scrollBtn) return;
    if(window.scrollY > 260){
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  }
  if(scrollBtn){
    window.addEventListener('scroll', toggleScrollButton);
    scrollBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleScrollButton();
  }

  document.getElementById('year').textContent=new Date().getFullYear();
})();
