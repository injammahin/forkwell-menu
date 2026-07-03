(() => {
  'use strict';

  const state = {
    menu: null,
    selectedCategory: 'all',
    itemsById: new Map(),
    cart: new Map()
  };

  const elements = {
    menuToggle: document.getElementById('menu-toggle'),
    categoryNav: document.getElementById('category-nav'),
    menuStatus: document.getElementById('menu-status'),
    menuSections: document.getElementById('menu-sections'),
    cartPanel: document.getElementById('cart-panel'),
    cartToggle: document.getElementById('cart-toggle'),
    cartBadge: document.getElementById('cart-badge'),
    cartClose: document.getElementById('cart-close'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    emptyCart: document.getElementById('empty-cart'),
    cartItems: document.getElementById('cart-items'),
    subtotal: document.getElementById('subtotal'),
    tax: document.getElementById('tax'),
    taxLabel: document.getElementById('tax-label'),
    total: document.getElementById('total'),
    checkoutButton: document.getElementById('checkout-button'),
    cartLive: document.getElementById('cart-live')
  };

  const mobileMedia = window.matchMedia('(max-width: 980px)');

  document.addEventListener('DOMContentLoaded', init);
  elements.menuToggle.addEventListener('click', toggleMobileMenu);
  elements.cartToggle.addEventListener('click', handleCartButtonClick);
  elements.cartClose.addEventListener('click', closeCartDrawer);
  elements.drawerBackdrop.addEventListener('click', closeOpenPanels);
  elements.checkoutButton.addEventListener('click', () => {
    announceCart('Checkout is visual only in this front-end demo.');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeOpenPanels();
    }
  });

  mobileMedia.addEventListener('change', (event) => {
    if (!event.matches) {
      closeOpenPanels(false);
    }
  });

  async function init() {
    try {
      const response = await fetch('menu.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Menu data could not be loaded.');
      }

      const menu = await response.json();
      state.menu = menu;
      state.itemsById = new Map(menu.items.map((item) => [item.id, item]));

      elements.taxLabel.textContent = `(${Math.round(Number(menu.tax_rate) * 100)}%)`;
      renderCategoryNav();
      renderMenu();
      renderCart(false);
    } catch (error) {
      elements.menuStatus.textContent = 'The menu could not be loaded. Run this project through a local server and check that menu.json is present.';
    }
  }

  function renderCategoryNav() {
    elements.categoryNav.replaceChildren();
    const navItems = ['all', ...state.menu.categories];

    navItems.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-button';
      button.dataset.category = category;
      button.setAttribute('aria-pressed', String(category === state.selectedCategory));

      const icon = document.createElement('i');
      icon.className = getCategoryIcon(category);
      icon.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.textContent = category === 'all' ? 'All' : category;

      button.append(icon, label);

      if (category === state.selectedCategory) {
        button.classList.add('is-active');
      }

      button.addEventListener('click', () => {
        state.selectedCategory = category;
        renderCategoryNav();
        renderMenu();
        closeMobileMenu(false);

        const menuTitle = document.getElementById('menu-title');
        if (menuTitle) {
          menuTitle.scrollIntoView({ block: 'start' });
        }
      });

      elements.categoryNav.append(button);
    });
  }

  function renderMenu() {
    elements.menuSections.replaceChildren();
    const categoriesToShow = state.selectedCategory === 'all'
      ? state.menu.categories
      : [state.selectedCategory];

    const renderedItems = categoriesToShow.reduce((total, category) => {
      return total + state.menu.items.filter((item) => item.category === category).length;
    }, 0);

    elements.menuStatus.textContent = state.selectedCategory === 'all'
      ? `Showing all categories. ${renderedItems} items available.`
      : `Showing ${state.selectedCategory}. ${renderedItems} items available.`;

    categoriesToShow.forEach((category) => {
      const items = state.menu.items.filter((item) => item.category === category);
      if (items.length === 0) {
        return;
      }

      const section = document.createElement('section');
      section.className = 'menu-category';
      section.id = `category-${slugify(category)}`;
      section.setAttribute('aria-labelledby', `heading-${slugify(category)}`);

      const headingWrap = document.createElement('div');
      headingWrap.className = 'category-heading';

      const heading = document.createElement('h2');
      heading.id = `heading-${slugify(category)}`;
      heading.className = 'category-title';

      const headingIcon = document.createElement('i');
      headingIcon.className = getCategoryIcon(category);
      headingIcon.setAttribute('aria-hidden', 'true');

      const headingText = document.createElement('span');
      headingText.textContent = category;

      heading.append(headingIcon, headingText);

      const count = document.createElement('p');
      count.className = 'category-count';
      count.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

      headingWrap.append(heading, count);

      const grid = document.createElement('div');
      grid.className = 'menu-grid';

      items.forEach((item) => {
        grid.append(createMenuCard(item));
      });

      section.append(headingWrap, grid);
      elements.menuSections.append(section);
    });
  }

  function createMenuCard(item) {
    const card = document.createElement('article');
    card.className = 'menu-card';

    const image = document.createElement('img');
    image.className = 'menu-card-image';
    image.src = item.image;
    image.alt = item.name;
    image.loading = 'lazy';

    const content = document.createElement('div');
    content.className = 'card-content';

    const topLine = document.createElement('div');
    topLine.className = 'item-topline';

    const title = document.createElement('h3');
    title.textContent = item.name;

    topLine.append(title);

    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    tagList.setAttribute('aria-label', `${item.name} tags`);

    item.tags.forEach((tag) => {
      const badge = document.createElement('span');
      badge.className = `tag tag-${slugify(tag)}`;
      const badgeIcon = document.createElement('i');
      badgeIcon.className = getTagIcon(tag);
      badgeIcon.setAttribute('aria-hidden', 'true');
      const badgeText = document.createElement('span');
      badgeText.textContent = tag;
      badge.append(badgeIcon, badgeText);
      tagList.append(badge);
    });

    const description = document.createElement('p');
    description.className = 'item-description';
    description.textContent = item.description;

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const price = document.createElement('span');
    price.className = 'item-price';
    price.textContent = formatMoney(dollarsToCents(item.price));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'add-button';
    button.setAttribute('aria-label', `Add ${item.name} to cart`);
    button.innerHTML = `<i class="fa-solid fa-plus" aria-hidden="true"></i><span class="sr-only">Add ${item.name} to cart</span>`;
    button.addEventListener('click', () => addToCart(item.id));

    footer.append(price, button);
    content.append(topLine, tagList, description, footer);
    card.append(image, content);

    return card;
  }

  function addToCart(itemId) {
    const item = state.itemsById.get(itemId);
    if (!item) {
      return;
    }

    const currentQty = state.cart.get(itemId) || 0;
    state.cart.set(itemId, currentQty + 1);
    renderCart();
  }

  function changeQuantity(itemId, direction) {
    const currentQty = state.cart.get(itemId) || 0;
    const nextQty = currentQty + direction;

    if (nextQty <= 0) {
      state.cart.delete(itemId);
    } else {
      state.cart.set(itemId, nextQty);
    }

    renderCart();
  }

  function removeFromCart(itemId) {
    state.cart.delete(itemId);
    renderCart();
  }

  function renderCart(announce = true) {
    elements.cartItems.replaceChildren();

    const cartEntries = Array.from(state.cart.entries())
      .map(([id, quantity]) => ({ item: state.itemsById.get(id), quantity }))
      .filter((entry) => entry.item);

    const itemCount = getCartItemCount();
    const subtotalCents = getSubtotalCents();
    const taxCents = getTaxCents(subtotalCents);
    const totalCents = subtotalCents + taxCents;

    elements.cartBadge.textContent = String(itemCount);
    elements.cartBadge.setAttribute('aria-label', `${itemCount} cart ${itemCount === 1 ? 'item' : 'items'}`);
    elements.cartToggle.setAttribute('aria-label', `Open cart. ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart.`);

    elements.emptyCart.classList.toggle('is-hidden', cartEntries.length > 0);
    elements.checkoutButton.disabled = cartEntries.length === 0;

    cartEntries.forEach(({ item, quantity }) => {
      elements.cartItems.append(createCartLine(item, quantity));
    });

    elements.subtotal.textContent = formatMoney(subtotalCents);
    elements.tax.textContent = formatMoney(taxCents);
    elements.total.textContent = formatMoney(totalCents);

    if (announce) {
      announceCart(`Cart updated. ${itemCount} ${itemCount === 1 ? 'item' : 'items'}. Total ${formatMoney(totalCents)}.`);
    }
  }

  function createCartLine(item, quantity) {
    const line = document.createElement('li');
    line.className = 'cart-item';

    const top = document.createElement('div');
    top.className = 'cart-line-top';

    const name = document.createElement('p');
    name.className = 'cart-item-name';
    name.textContent = item.name;

    const lineTotal = document.createElement('span');
    lineTotal.className = 'cart-line-total';
    lineTotal.textContent = formatMoney(getLineTotalCents(item, quantity));

    top.append(name, lineTotal);

    const controls = document.createElement('div');
    controls.className = 'cart-controls';

    const stepper = document.createElement('div');
    stepper.className = 'qty-stepper';
    stepper.setAttribute('aria-label', `Quantity controls for ${item.name}`);

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'qty-button';
    minus.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
    minus.setAttribute('aria-label', `Decrease ${item.name} quantity`);
    minus.addEventListener('click', () => changeQuantity(item.id, -1));

    const qty = document.createElement('span');
    qty.className = 'qty-value';
    qty.textContent = String(quantity);
    qty.setAttribute('aria-label', `${quantity} selected`);

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'qty-button';
    plus.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
    plus.setAttribute('aria-label', `Increase ${item.name} quantity`);
    plus.addEventListener('click', () => changeQuantity(item.id, 1));

    stepper.append(minus, qty, plus);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.setAttribute('aria-label', `Remove ${item.name} from cart`);
    remove.innerHTML = `<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span class="sr-only">Remove ${item.name} from cart</span>`;
    remove.addEventListener('click', () => removeFromCart(item.id));

    controls.append(stepper, remove);
    line.append(top, controls);

    return line;
  }

  function getLineTotalCents(item, quantity) {
    return dollarsToCents(item.price) * quantity;
  }

  function getSubtotalCents() {
    return Array.from(state.cart.entries()).reduce((sum, [id, quantity]) => {
      const item = state.itemsById.get(id);
      return item ? sum + getLineTotalCents(item, quantity) : sum;
    }, 0);
  }

  function getTaxCents(subtotalCents) {
    return Math.round(subtotalCents * Number(state.menu.tax_rate));
  }

  function getCartItemCount() {
    return Array.from(state.cart.values()).reduce((sum, quantity) => sum + quantity, 0);
  }

  function dollarsToCents(value) {
    return Math.round(Number(value) * 100);
  }

  function formatMoney(cents) {
    const symbol = state.menu ? state.menu.currency_symbol : '$';
    const amount = (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${symbol}${amount}`;
  }

  function handleCartButtonClick() {
    closeMobileMenu(false);

    if (mobileMedia.matches) {
      openCartDrawer();
      return;
    }

    elements.cartPanel.scrollIntoView({ block: 'start' });
    elements.cartPanel.focus({ preventScroll: true });
  }

  function toggleMobileMenu() {
    if (!mobileMedia.matches) {
      return;
    }

    if (document.body.classList.contains('nav-open')) {
      closeMobileMenu();
    } else {
      closeCartDrawer(false);
      document.body.classList.add('nav-open');
      elements.menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  function closeMobileMenu(returnFocus = true) {
    if (!document.body.classList.contains('nav-open')) {
      return;
    }

    document.body.classList.remove('nav-open');
    elements.menuToggle.setAttribute('aria-expanded', 'false');

    if (returnFocus) {
      elements.menuToggle.focus();
    }
  }

  function openCartDrawer() {
    document.body.classList.add('drawer-open');
    elements.cartToggle.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => elements.cartClose.focus(), 0);
  }

  function closeCartDrawer(returnFocus = true) {
    if (!document.body.classList.contains('drawer-open')) {
      return;
    }

    document.body.classList.remove('drawer-open');
    elements.cartToggle.setAttribute('aria-expanded', 'false');

    if (returnFocus) {
      elements.cartToggle.focus();
    }
  }

  function closeOpenPanels(returnFocus = true) {
    closeMobileMenu(returnFocus);
    closeCartDrawer(returnFocus);
  }

  function announceCart(message) {
    elements.cartLive.textContent = message;
  }

  function slugify(value) {
    return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function getCategoryIcon(category) {
    const icons = {
      all: 'fa-solid fa-border-all',
      Starters: 'fa-solid fa-utensils',
      Mains: 'fa-solid fa-bowl-food',
      Sides: 'fa-solid fa-seedling',
      Desserts: 'fa-solid fa-ice-cream',
      Drinks: 'fa-solid fa-mug-hot'
    };

    return icons[category] || 'fa-solid fa-utensils';
  }

  function getTagIcon(tag) {
    const icons = {
      veg: 'fa-solid fa-leaf',
      spicy: 'fa-solid fa-pepper-hot',
      popular: 'fa-solid fa-star'
    };

    return icons[tag] || 'fa-solid fa-tag';
  }
})();
