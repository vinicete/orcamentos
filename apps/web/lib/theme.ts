export const THEME_STORAGE_KEY = 'tema';

const THEME_COLOR = { claro: '#f3f2f2', escuro: '#171515' };

// Roda no <head> antes da primeira pintura. Sem escolha salva, segue o sistema. Também mantém a
// cor da barra do navegador (theme-color) igual ao fundo quando a classe .dark muda.
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)'),c=document.createElement('meta');c.name='theme-color';document.head.appendChild(c);function s(){c.content=d.classList.contains('dark')?'${THEME_COLOR.escuro}':'${THEME_COLOR.claro}'}function a(){var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}d.classList.toggle('dark',t?t==='escuro':m.matches)}new MutationObserver(s).observe(d,{attributes:true,attributeFilter:['class']});a();s();m.addEventListener('change',a)})()`;
