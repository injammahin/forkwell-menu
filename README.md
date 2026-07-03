# Forkwell Menu

Responsive single-page restaurant menu and live cart built with plain HTML, CSS, and JavaScript.

## Run locally

Because the app loads `menu.json` with `fetch`, run it through a local static server instead of opening `index.html` directly.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

On Windows, this also works from the project folder if Python is installed:

```bash
py -m http.server 8000
```

## Editing the menu

Edit `menu.json` only. The page renders item names, prices, descriptions, images, tags, categories, currency symbol, and tax rate from that file.

Menu item image paths should point to files inside the `images/` folder, for example:

```json
"image": "images/cat_mains.png"
```

## Cart rules

- Line total = item price × quantity
- Subtotal = sum of line totals
- Tax = subtotal × `tax_rate`
- Total = subtotal + tax
- The cart badge shows the sum of item quantities

The checkout button is visual only. There is no backend, payment gateway, order submission, database, login, or saved cart.

## Files

```text
Forkwell_Menu/
  index.html
  styles.css
  app.js
  menu.json
  README.md
  images/
    forkwell_logo.png
    cat_starters.png
    cat_mains.png
    cat_sides.png
    cat_desserts.png
    cat_drinks.png
```
