export const THEME_STORAGE_KEY = 'tema';

// Roda no <head> antes da primeira pintura. Sem escolha salva, segue o sistema.
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)');function a(){var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}d.classList.toggle('dark',t?t==='escuro':m.matches)}a();m.addEventListener('change',a)})()`;
