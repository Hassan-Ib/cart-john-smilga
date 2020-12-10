const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "vajel9mfz0r6",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "W3UjDMEZRW869nRjFz0i9QwA7KdSZi6KWCirjeEVpJQ",
});

// console.log(client);

// import { docElement } from "./view";

// var domElements = require("./view");

// console.log(docElement);

// variable
const docElement = {
  cartBtn: document.querySelector(".cart-btn"),
  closeCartBtn: document.querySelector(".close-cart"),
  clearCartBtn: document.querySelector(".clear-cart"),
  cartDOM: document.querySelector(".cart"),
  cartOverlay: document.querySelector(".cart-overlay"),
  cartItems: document.querySelector(".cart-items"),
  cartTotal: document.querySelector(".cart-total"),
  cartContent: document.querySelector(".cart-content"),
  productDOM: document.querySelector(".products-center"),
};
// cart
let cart = [];

let buttonsDOM = [];

// getting the product

class Products {
  async getProducts() {
    try {
      let contentFull = await client.getEntries({
        content_type: "furnitureProduct",
      });
      console.log(contentFull.items);
      let result = await fetch("products.json");
      if (!result.ok) {
        throw new Error(`failed to fetch Error ${result.status}`);
        return;
      }
      let data = await result.json();
      let products = contentFull.items;
      //   console.log(data);
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const { url: image } = item.fields.image.fields.file;
        return { title, price, id, image };
      });

      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display product
class UI {
  _parentElement = docElement.productDOM;
  renderProduct(products) {
    let result = "";
    products.forEach((product) => {
      result += this._markUp(product);
    });
    this._parentElement.insertAdjacentHTML("afterbegin", result);
  }

  _markUp(product) {
    return `
          <!-- single product -->
 
      <article class="product">
            <div class="img-container">
              <img
                class="product-img"
                src=${product.image}
                alt=${product.title}
              />
              <button class="bag-btn" data-id=${product.id}>
                <i class="fas fa-shopping-cart"></i>
                add to bag
              </button>
            </div>
            <h3>${product.title}</h3>
            <h4>$${product.price}</h4>
          </article>
          <!-- single product end -->

      `;
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    // console.log(buttons);
    buttonsDOM = buttons;
    buttons.forEach((btn) => {
      // .dataset to get dataset of a tag
      let id = btn.dataset.id;
      //   console.log(id);
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        btn.innerText = "In Cart";
        btn.disabled = true;
      }

      btn.addEventListener("click", (e) => {
        e.target.innerText = "In Cart";
        e.target.disabled = true;

        // 1) get product from products base on id
        let cartItem = { ...Storage.getProduct(id), amount: 1 };

        // 2) add product to cart
        cart = [...cart, cartItem];

        // 3) save cart in local storage
        Storage.saveCart(cart);
        // 4) upadate cart value
        this._setCartValue(cart);
        // 5) render cart item
        this._renderCartItem(cartItem);
        // 6) show cart
        // this._showCart();
      });
    });
  }
  _showCart() {
    docElement.cartOverlay.classList.add("transparentBcg");
    docElement.cartDOM.classList.add("showCart");
  }
  setupAPP() {
    cart = Storage.getCart();
    this._setCartValue(cart);
    this._populateCart(cart);
    docElement.cartBtn.addEventListener("click", this._showCart);
    docElement.closeCartBtn.addEventListener("click", this._hideCart);
  }
  _hideCart() {
    docElement.cartDOM.classList.remove("showCart");
    docElement.cartOverlay.classList.remove("transparentBcg");
  }

  _populateCart(cart) {
    cart.forEach((item) => {
      this._renderCartItem(item);
    });
  }
  _setCartValue(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    docElement.cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    docElement.cartItems.innerText = itemsTotal;
    // console.log(tempTotal, itemsTotal);
  }

  _renderCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
       <img src=${item.image} alt=${item.title} />
            <div>
              <h4>${item.title}</h4>
              <h5>$${item.price}</h5>
              <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
              <i class="fas fa-chevron-up" data-id=${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>`;
    docElement.cartContent.appendChild(div);
    console.log(docElement.cartContent);
  }
  cartLogic() {
    docElement.clearCartBtn.addEventListener("click", () => {
      this._clearCart();
    });

    docElement.cartContent.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-item")) {
        let removeItem = e.target;
        let id = removeItem.dataset.id;
        this._removeItem(id);
        docElement.cartContent.removeChild(
          removeItem.parentElement.parentElement
        );
        // console.log(removeItem);
      } else if (e.target.classList.contains("fa-chevron-up")) {
        let addAmount = e.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        // needed to update localStorage since we updated our cart
        Storage.saveCart(cart);
        this._setCartValue(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (e.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = e.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this._setCartValue(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          docElement.cartContent.removeChild(
            lowerAmount.parentElement.parentElement
          );
          this._removeItem(id);
        }
      }
    });
  }
  _clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this._removeItem(id));
    while (docElement.cartContent.children.length > 0) {
      docElement.cartContent.removeChild(docElement.cartContent.children[0]);
    }
    this._hideCart();
  }
  _removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this._setCartValue(cart);
    Storage.saveCart(cart);
    let button = this._getSingleBtn(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }

  _getSingleBtn(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

function init() {
  document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();

    const products = new Products();
    // setUp APP
    ui.setupAPP();

    //   get all products
    products
      .getProducts()
      .then((products) => {
        // console.log(products);
        ui.renderProduct(products);
        // storings products array inside the local storage
        Storage.saveProducts(products);
      })
      .then(() => {
        ui.getBagButtons();
        ui.cartLogic();
      });
  });
}

init();
