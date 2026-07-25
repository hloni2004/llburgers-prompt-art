export const dismissSplash = (delayMs = 400) => {
    const splash = document.getElementById('splash');
    if (!splash) return;

    splash.style.pointerEvents = 'none';
    splash.style.opacity = '0';

    window.setTimeout(() => {
        splash.remove();
    }, delayMs);
};
