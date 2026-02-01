document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save-btn');
  const colorInput = document.getElementById('color-input');
  const helloText = document.getElementById('hello-text');

  saveBtn.addEventListener('click', () => {
    const color = colorInput.value;
    if (color) {
      helloText.style.color = color;
    }
  });
});
