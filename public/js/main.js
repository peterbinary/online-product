document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const hamburgerMenu = document.querySelector(".hamburger-menu")
  const mainNav = document.querySelector(".main-nav")
  const adminLink = document.getElementById("admin-link")
  const adminLinkFooter = document.getElementById("admin-link-footer")
  const aboutLink = document.getElementById("about-link")
  const aboutLinkFooter = document.getElementById("about-link-footer")
  const contactLink = document.getElementById("contact-link")
  const contactLinkFooter = document.getElementById("contact-link-footer")

  const transactionInput = document.getElementById("transaction-id")
  const trackBtn = document.getElementById("track-btn")
  const productTracking = document.getElementById("product-tracking")
  const productsContainer = document.getElementById("products-container")

  const adminLoginModal = document.getElementById("admin-login-modal")
  const adminLoginForm = document.getElementById("admin-login-form")
  const loginError = document.getElementById("login-error")

  const generalModal = document.getElementById("general-modal")
  const modalContent = document.getElementById("modal-content")
  const closeModalButtons = document.querySelectorAll(".close-modal")

  // Toggle hamburger menu
  hamburgerMenu.addEventListener("click", function () {
    this.classList.toggle("active")
    mainNav.classList.toggle("active")
  })

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!hamburgerMenu.contains(e.target) && !mainNav.contains(e.target)) {
      hamburgerMenu.classList.remove("active")
      mainNav.classList.remove("active")
    }
  })

  // Load products
  async function loadProducts() {
    try {
      const response = await fetch("/api/products")
      const products = await response.json()

      if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products available yet.</div>'
        return
      }

      productsContainer.innerHTML = ""

      products.forEach((product) => {
        const productCard = document.createElement("div")
        productCard.className = "product-card"

        productCard.innerHTML = `
          <div class="product-image">
            <img src="${product.photos[0]}" alt="${product.name}">
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description.substring(0, 100)}${product.description.length > 100 ? "..." : ""}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-meta">
              <span>In stock: ${product.quantityLeft}</span>
              <span class="transaction-id">********</span>
            </div>
          </div>
        `

        productsContainer.appendChild(productCard)
      })
    } catch (error) {
      console.error("Error loading products:", error)
      productsContainer.innerHTML = '<div class="error">Failed to load products. Please try again later.</div>'
    }
  }

  // Track product by transaction ID
  async function trackProduct() {
    const transactionId = transactionInput.value.trim()

    if (!transactionId) {
      showModal("Error", "Please enter a transaction ID to track your order.")
      return
    }

    try {
      const response = await fetch(`/api/products/transaction/${transactionId}`)

      if (!response.ok) {
        throw new Error("Product not found")
      }

      const product = await response.json()

      productTracking.style.display = "block"
      productTracking.innerHTML = `
        <h3>Order Tracking: ${product.transactionId}</h3>
        <div class="tracking-details">
          <div class="tracking-images">
            ${product.photos
              .map(
                (photo) => `
              <img src="${photo}" alt="${product.name}">
            `,
              )
              .join("")}
          </div>
          <div class="tracking-info">
            <h4>${product.name}</h4>
            <p>${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="tracking-meta">
              <div><span>Transaction ID:</span> <span>${product.transactionId}</span></div>
              <div><span>Order Date:</span> <span>${new Date(product.orderDate || product.uploadDate).toLocaleDateString()}</span></div>
              <div><span>Shipping Date:</span> <span>${new Date(product.shippingDate).toLocaleDateString()}</span></div>
              <div><span>Expected Arrival:</span> <span>${new Date(product.arrivalDate).toLocaleDateString()}</span></div>
              <div><span>Status:</span> <span>${product.status || "Pending"}</span></div>
              <div><span>Sender:</span> <span>${product.senderName || "N/A"}</span></div>
              <div><span>Receiver:</span> <span>${product.receiverName || "N/A"}</span></div>
            </div>
          </div>
        </div>
      `

      // Scroll to tracking result
      productTracking.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("Error tracking product:", error)
      showModal("Product Not Found", "The transaction ID you entered could not be found. Please check and try again.")
    }
  }

  // Get order status based on dates
  function getOrderStatus(product) {
    // If product has a status field, use it instead of calculating based on dates
    if (product.status) {
      return product.status.charAt(0).toUpperCase() + product.status.slice(1)
    }

    const now = new Date()
    const shippingDate = new Date(product.shippingDate)
    const arrivalDate = new Date(product.arrivalDate)

    if (now < shippingDate) {
      return "Processing"
    } else if (now >= shippingDate && now < arrivalDate) {
      return "Shipped"
    } else {
      return "Delivered"
    }
  }

  // Show modal
  function showModal(title, content) {
    modalContent.innerHTML = `
      <h2>${title}</h2>
      <div class="modal-body">${content}</div>
    `
    generalModal.style.display = "block"
  }

  // Admin login
  function showAdminLogin() {
    adminLoginModal.style.display = "block"
  }

  // Handle admin login
  async function handleAdminLogin(e) {
    e.preventDefault()

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem("adminLoggedIn", "true") // ← ADD THIS LINE
        window.location.href = "admin.html"
      } else {
        loginError.textContent = "Invalid username or password"
      }
    } catch (error) {
      console.error("Login error:", error)
      loginError.textContent = "An error occurred. Please try again."
    }
  }

  // Event listeners
  trackBtn.addEventListener("click", trackProduct)

  transactionInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      trackProduct()
    }
  })

  adminLink.addEventListener("click", (e) => {
    e.preventDefault()
    showAdminLogin()
  })

  adminLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    showAdminLogin()
  })

  adminLoginForm.addEventListener("submit", handleAdminLogin)

  aboutLink.addEventListener("click", (e) => {
    e.preventDefault()
    showModal(
      "About CBL Online Products",
      `
      <p>CBL Online Products is a leading online marketplace offering a wide range of products at competitive prices.</p>
      <p>Our mission is to provide customers with a seamless shopping experience and high-quality products.</p>
    `,
    )
  })

  contactLink.addEventListener("click", (e) => {
    e.preventDefault()
    showModal(
      "Contact Us",
      `
      <p>Email: info@cblonlineproducts.com</p>
      <p>Phone: +123 456 7890</p>
      <p>Address: 123 E-Commerce Street, Digital City</p>
    `,
    )
  })

  aboutLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    aboutLink.click()
  })

  contactLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    contactLink.click()
  })

  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      adminLoginModal.style.display = "none"
      generalModal.style.display = "none"
    })
  })

  window.addEventListener("click", (e) => {
    if (e.target === adminLoginModal) {
      adminLoginModal.style.display = "none"
    }
    if (e.target === generalModal) {
      generalModal.style.display = "none"
    }
  })

  // Initialize
  loadProducts()
})

