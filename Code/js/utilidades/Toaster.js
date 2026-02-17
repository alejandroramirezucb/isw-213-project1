(function () {
  const containerId = 'site-toaster-container';

  function ensureContainer() {
    let c = document.getElementById(containerId);
    if (!c) {
      c = document.createElement('div');
      c.id = containerId;
      c.className = 'toaster-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function createToastEl(
    message,
    { type = 'info', actionText, action, persistent = false } = {},
  ) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;

    const msg = document.createElement('div');
    msg.className = 'toast__message';
    msg.innerText = message;
    el.appendChild(msg);

    const actions = document.createElement('div');
    actions.className = 'toast__actions';

    if (actionText && typeof action === 'function') {
      const btn = document.createElement('button');
      btn.className = 'toast__btn toast__btn--action';
      btn.innerText = actionText;
      btn.addEventListener('click', (e) => {
        try {
          action();
        } catch (e) {
          console.error(e);
        }
        remove();
      });
      actions.appendChild(btn);
    }

    const close = document.createElement('button');
    close.className = 'toast__btn toast__btn--close';
    close.innerText = '✕';
    close.addEventListener('click', remove);
    actions.appendChild(close);

    el.appendChild(actions);

    function remove() {
      el.classList.remove('toast--show');
      setTimeout(() => el.remove(), 300);
    }

    return { el, remove };
  }

  function showToast(
    message,
    {
      type = 'info',
      duration = 4000,
      actionText,
      action,
      persistent = false,
    } = {},
  ) {
    try {
      const container = ensureContainer();
      const { el, remove } = createToastEl(message, {
        type,
        actionText,
        action,
        persistent,
      });
      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('toast--show'));
      if (!persistent && duration > 0) {
        setTimeout(remove, duration);
      }
      return { remove };
    } catch (err) {
      console.error('showToast error', err);
    }
  }

  function showConfirm(
    message,
    {
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning',
    } = {},
  ) {
    return new Promise((resolve) => {
      const container = ensureContainer();
      const el = document.createElement('div');
      el.className = `toast toast--${type} toast--confirm`;

      const msg = document.createElement('div');
      msg.className = 'toast__message';
      msg.innerText = message;
      el.appendChild(msg);

      const actions = document.createElement('div');
      actions.className = 'toast__actions';

      const btnCancel = document.createElement('button');
      btnCancel.className = 'toast__btn toast__btn--cancel';
      btnCancel.innerText = cancelText;
      btnCancel.addEventListener('click', () => {
        close();
        resolve(false);
      });

      const btnOk = document.createElement('button');
      btnOk.className = 'toast__btn toast__btn--ok';
      btnOk.innerText = confirmText;
      btnOk.addEventListener('click', () => {
        close();
        resolve(true);
      });

      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      el.appendChild(actions);

      function close() {
        el.classList.remove('toast--show');
        setTimeout(() => el.remove(), 200);
      }

      container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('toast--show'));
    });
  }

  window.showToast = showToast;
  window.showConfirm = showConfirm;
})();
