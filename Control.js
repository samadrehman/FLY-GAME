window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') window.controls.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') window.controls.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') window.controls.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') window.controls.down = true;
  });
  
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') window.controls.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') window.controls.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') window.controls.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') window.controls.down = false;
  });