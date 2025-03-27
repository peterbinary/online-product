document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in (simple check for demo purposes)
  if (!sessionStorage.getItem("adminLoggedIn")) {
    window.location.href = "index.html"
    return
  }

  // DOM Elements
  const hamburgerMenu = document.querySelector(".hamburger-menu")
  const mainNav = document.querySelector(".main-nav")
  const dashboardLink = document.getElementById("dashboard-link")
  const addProductLink = document.getElementById("add-product-link")
  const viewProductsLink = document.getElementById("view-products-link")
  const logoutLink = document.getElementById("logout-link")
  const dashboardLinkFooter = document.getElementById("dashboard-link-footer")
  const addProductLinkFooter = document.getElementById("add-product-link-footer")
  const viewProductsLinkFooter = document.getElementById("view-products-link-footer")

  const adminSearchInput = document.getElementById("admin-search-input")
  const adminSearchBtn = document.getElementById("admin-search-btn")

  const dashboardSection = document.getElementById("dashboard-section")
  const addProductSection = document.getElementById("add-product-section")
  const viewProductsSection = document.getElementById("view-products-section")
  const editProductSection = document.getElementById("edit-product-section")
  const productDetailSection = document.getElementById("product-detail-section")

  const totalProductsEl = document.getElementById("total-products")
  const productsShippedEl = document.getElementById("products-shipped")
  const productsInStockEl = document.getElementById("products-in-stock")
  const recentProductsList = document.getElementById("recent-products-list")

  const adminProductsGrid = document.getElementById("admin-products-grid")
  const adminProductDetail = document.getElementById("admin-product-detail")

  const addProductForm = document.getElementById("add-product-form")
  const editProductForm = document.getElementById("edit-product-form")
  const deleteProductBtn = document.getElementById("delete-product-btn")

  const productPhotosInput = document.getElementById("product-photos")
  const photoPreview = document.getElementById("photo-preview")
  const editProductPhotosInput = document.getElementById("edit-product-photos")
  const editPhotoPreview = document.getElementById("edit-photo-preview")
  const currentPhotos = document.getElementById("current-photos")

  const adminModal = document.getElementById("admin-modal")
  const adminModalContent = document.getElementById("admin-modal-content")
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

  // Show section
  function showSection(section) {
    // Hide all sections
    dashboardSection.classList.remove("active")
    addProductSection.classList.remove("active")
    viewProductsSection.classList.remove("active")
    editProductSection.classList.remove("active")
    productDetailSection.classList.remove("active")

    // Show selected section
    section.classList.add("active")

    // Update active nav link
    document.querySelectorAll(".main-nav a").forEach((link) => {
      link.classList.remove("active")
    })

    if (section === dashboardSection) {
      dashboardLink.classList.add("active")
    } else if (section === addProductSection) {
      addProductLink.classList.add("active")
    } else if (section === viewProductsSection) {
      viewProductsLink.classList.add("active")
    }
  }

  // Load dashboard stats
  async function loadDashboardStats() {
    try {
      const response = await fetch("/api/products")
      const products = await response.json()

      const totalProducts = products.length
      let totalShipped = 0
      let totalInStock = 0

      products.forEach((product) => {
        totalShipped += product.quantitySent || 0
        totalInStock += product.quantityLeft || 0
      })

      totalProductsEl.textContent = totalProducts
      productsShippedEl.textContent = totalShipped
      productsInStockEl.textContent = totalInStock

      // Load recent products (last 5)
      loadRecentProducts(products)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    }
  }

  // Load recent products
  function loadRecentProducts(products) {
    if (!products || products.length === 0) {
      recentProductsList.innerHTML = '<div class="no-products">No products available yet.</div>'
      return
    }

    // Sort by upload date (newest first) and take first 5
    const recentProducts = [...products].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 5)

    recentProductsList.innerHTML = ""

    recentProducts.forEach((product) => {
      const productCard = document.createElement("div")
      productCard.className = "recent-product-card"

      productCard.innerHTML = `
        <div class="recent-product-image">
          <img src="${product.photos[0]}" alt="${product.name}">
        </div>
        <div class="recent-product-info">
          <h4>${product.name}</h4>
          <div class="recent-product-meta">
            <span>$${product.price.toFixed(2)}</span>
            <span>ID: ${product.transactionId}</span>
          </div>
        </div>
      `

      recentProductsList.appendChild(productCard)
    })
  }

  // Load products for admin view
  async function loadAdminProducts() {
    try {
      const response = await fetch("/api/products")
      const products = await response.json()

      if (products.length === 0) {
        adminProductsGrid.innerHTML = '<div class="no-products">No products available yet.</div>'
        return
      }

      adminProductsGrid.innerHTML = ""

      products.forEach((product) => {
        const productCard = document.createElement("div")
        productCard.className = "admin-product-card"

        productCard.innerHTML = `
          <div class="admin-product-image">
            <img src="${product.photos[0]}" alt="${product.name}">
          </div>
          <div class="admin-product-info">
            <h3>${product.name}</h3>
            <div class="admin-product-meta">
              <div><span>Transaction ID:</span> <span>${product.transactionId}</span></div>
              <div><span>Price:</span> <span>$${product.price.toFixed(2)}</span></div>
              <div><span>Stock:</span> <span>${product.quantityLeft}/${product.quantity}</span></div>
            </div>
            <div class="admin-product-actions">
              <button class="btn btn-primary view-btn" data-id="${product.id}">View</button>
              <button class="btn btn-primary edit-btn" data-id="${product.id}">Edit</button>
            </div>
          </div>
        `

        adminProductsGrid.appendChild(productCard)

        // Add event listeners to buttons
        productCard.querySelector(".view-btn").addEventListener("click", () => {
          showAdminProductDetail(product.id)
        })

        productCard.querySelector(".edit-btn").addEventListener("click", () => {
          loadProductForEdit(product.id)
        })
      })
    } catch (error) {
      console.error("Error loading products:", error)
      adminProductsGrid.innerHTML = '<div class="error">Failed to load products. Please try again later.</div>'
    }
  }

  // Show product detail in admin view
  async function showAdminProductDetail(productId) {
    try {
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error("Product not found")
      }

      const product = await response.json()

      adminProductDetail.innerHTML = `
        <div class="admin-product-detail">
          <div class="admin-product-detail-images">
            ${product.photos
              .map(
                (photo) => `
              <img src="${photo}" alt="${product.name}">
            `,
              )
              .join("")}
          </div>
          <div class="admin-product-detail-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="admin-product-detail-meta">
              <div><span>Transaction ID:</span> <span>${product.transactionId}</span></div>
              <div><span>Order Date:</span> <span>${new Date(product.orderDate || product.uploadDate).toLocaleDateString()}</span></div>
              <div><span>Upload Date:</span> <span>${new Date(product.uploadDate).toLocaleString()}</span></div>
              <div><span>Shipping Date:</span> <span>${new Date(product.shippingDate).toLocaleDateString()}</span></div>
              <div><span>Expected Arrival:</span> <span>${new Date(product.arrivalDate).toLocaleDateString()}</span></div>
              <div><span>Total Quantity:</span> <span>${product.quantity}</span></div>
              <div><span>Quantity Sent:</span> <span>${product.quantitySent || 0}</span></div>
              <div><span>Quantity Left:</span> <span>${product.quantityLeft}</span></div>
              <div><span>Status:</span> <span>${product.status || "Pending"}</span></div>
              <div><span>Sender:</span> <span>${product.senderName || "N/A"}</span></div>
              <div><span>Receiver:</span> <span>${product.receiverName || "N/A"}</span></div>
            </div>
            <div class="admin-product-actions" style="margin-top: 2rem;">
              <button class="btn btn-primary edit-detail-btn" data-id="${product.id}">Edit Product</button>
            </div>
          </div>
        </div>
      `

      showSection(productDetailSection)

      // Add event listener to edit button
      adminProductDetail.querySelector(".edit-detail-btn").addEventListener("click", () => {
        loadProductForEdit(product.id)
      })
    } catch (error) {
      console.error("Error fetching product:", error)
      showAdminModal("Product Not Found", "The product you are looking for could not be found.")
    }
  }

  // Load product for editing
  async function loadProductForEdit(productId) {
    try {
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error("Product not found")
      }

      const product = await response.json()

      // Fill the edit form
      document.getElementById("edit-product-id").value = product.id
      document.getElementById("edit-product-name").value = product.name
      document.getElementById("edit-product-description").value = product.description
      document.getElementById("edit-product-price").value = product.price
      document.getElementById("edit-product-quantity").value = product.quantity
      document.getElementById("edit-product-order-date").value = product.orderDate
        ? new Date(product.orderDate).toISOString().split("T")[0]
        : new Date(product.uploadDate).toISOString().split("T")[0]
      document.getElementById("edit-product-arrival").value = new Date(product.arrivalDate).toISOString().split("T")[0]
      document.getElementById("edit-product-shipping").value = new Date(product.shippingDate)
        .toISOString()
        .split("T")[0]
      document.getElementById("edit-product-sent").value = product.quantitySent || 0
      document.getElementById("edit-product-status").value = product.status || "pending"
      document.getElementById("edit-sender-name").value = product.senderName || ""
      document.getElementById("edit-receiver-name").value = product.receiverName || ""

      // Display current photos
      currentPhotos.innerHTML = ""
      product.photos.forEach((photo) => {
        const photoContainer = document.createElement("div")
        photoContainer.className = "photo-container"
        photoContainer.innerHTML = `
          <img src="${photo}" alt="${product.name}">
        `
        currentPhotos.appendChild(photoContainer)
      })

      showSection(editProductSection)
    } catch (error) {
      console.error("Error loading product for edit:", error)
      showAdminModal("Error", "Failed to load product for editing.")
    }
  }

  // Preview product photos
  function previewPhotos(input, previewElement) {
    previewElement.innerHTML = ""

    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const reader = new FileReader()

        reader.onload = (e) => {
          const img = document.createElement("img")
          img.src = e.target.result
          previewElement.appendChild(img)
        }

        reader.readAsDataURL(input.files[i])
      }
    }
  }

  // Show admin modal
  function showAdminModal(title, content) {
    adminModalContent.innerHTML = `
      <h2>${title}</h2>
      <div class="modal-body">${content}</div>
    `
    adminModal.style.display = "block"
  }

  // Search product by ID in admin
  function searchAdminProduct() {
    const searchTerm = adminSearchInput.value.trim()

    if (!searchTerm) {
      showAdminModal("Error", "Please enter a Transaction ID or Product ID to search.")
      return
    }

    // First try to find by transaction ID, then by product ID
    fetch(`/api/products/transaction/${searchTerm}`)
      .then((response) => {
        if (!response.ok) {
          return fetch(`/api/products/${searchTerm}`)
        }
        return response
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Product not found")
        }
        return response.json()
      })
      .then((product) => {
        showAdminProductDetail(product.id)
      })
      .catch((error) => {
        console.error("Error searching product:", error)
        showAdminModal("Product Not Found", "The product you are looking for could not be found.")
      })
  }

  // Event listeners
  dashboardLink.addEventListener("click", (e) => {
    e.preventDefault()
    showSection(dashboardSection)
    loadDashboardStats()
  })

  addProductLink.addEventListener("click", (e) => {
    e.preventDefault()
    showSection(addProductSection)
  })

  viewProductsLink.addEventListener("click", (e) => {
    e.preventDefault()
    showSection(viewProductsSection)
    loadAdminProducts()
  })

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault()
    sessionStorage.removeItem("adminLoggedIn")
    window.location.href = "index.html"
  })

  dashboardLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    dashboardLink.click()
  })

  addProductLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    addProductLink.click()
  })

  viewProductsLinkFooter.addEventListener("click", (e) => {
    e.preventDefault()
    viewProductsLink.click()
  })

  adminSearchBtn.addEventListener("click", searchAdminProduct)

  adminSearchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchAdminProduct()
    }
  })

  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      adminModal.style.display = "none"
    })
  })

  window.addEventListener("click", (e) => {
    if (e.target === adminModal) {
      adminModal.style.display = "none"
    }
  })

  productPhotosInput.addEventListener("change", function () {
    previewPhotos(this, photoPreview)
  })

  editProductPhotosInput.addEventListener("change", function () {
    previewPhotos(this, editPhotoPreview)
  })

  // Add product form submission
  addProductForm.addEventListener("submit", async function (e) {
    e.preventDefault()

    if (productPhotosInput.files.length < 2) {
      showAdminModal("Error", "Please select at least 2 photos for the product.")
      return
    }

    const formData = new FormData(this)

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to add product")
      }

      const result = await response.json()

      showAdminModal(
        "Success",
        `
        <p>Product added successfully!</p>
        <p>Transaction ID: <strong>${result.transactionId}</strong></p>
        <p>Share this Transaction ID with customers to track their order.</p>
      `,
      )

      addProductForm.reset()
      photoPreview.innerHTML = ""
      loadDashboardStats()
    } catch (error) {
      console.error("Error adding product:", error)
      showAdminModal("Error", "Failed to add product. Please try again.")
    }
  })

  // Edit product form submission
  editProductForm.addEventListener("submit", async function (e) {
    e.preventDefault()

    const productId = document.getElementById("edit-product-id").value
    const formData = new FormData(this)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update product")
      }

      const result = await response.json()

      showAdminModal("Success", "Product updated successfully!")
      editPhotoPreview.innerHTML = ""
      loadDashboardStats()
      loadAdminProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      showAdminModal("Error", "Failed to update product. Please try again.")
    }
  })

  // Delete product
  deleteProductBtn.addEventListener("click", async () => {
    const productId = document.getElementById("edit-product-id").value

    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      showAdminModal("Success", "Product deleted successfully!")
      editProductForm.reset()
      editPhotoPreview.innerHTML = ""
      currentPhotos.innerHTML = ""
      loadDashboardStats()
      showSection(viewProductsSection)
      loadAdminProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      showAdminModal("Error", "Failed to delete product. Please try again.")
    }
  })

  // Initialize
  showSection(dashboardSection)
  loadDashboardStats()
})

