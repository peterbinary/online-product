import express from "express"
import { promises as fs } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"
import crypto from "crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})
const upload = multer({ storage: storage })

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))

// Data file path
const GOODS_FILE = path.join(__dirname, "data", "goods.json")

// Generate transaction ID (9 characters mix of letters and numbers)
function generateTransactionId() {
  return crypto.randomBytes(4).toString("hex").substring(0, 9).toUpperCase()
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, "data"), { recursive: true })
    await fs.mkdir(path.join(__dirname, "public", "uploads"), { recursive: true })
    try {
      await fs.access(GOODS_FILE)
    } catch {
      await fs.writeFile(GOODS_FILE, JSON.stringify([]))
    }
  } catch (err) {
    console.error("Error setting up data directory:", err)
  }
}

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" })
  }
})

// Get product by transaction ID
app.get("/api/products/transaction/:transactionId", async (req, res) => {
  try {
    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    const product = products.find((p) => p.transactionId === req.params.transactionId)

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json(product)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" })
  }
})

// Get product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    const product = products.find((p) => p.id === req.params.id)

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json(product)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" })
  }
})

// Add new product
app.post("/api/products", upload.array("photos", 5), async (req, res) => {
  try {
    const { name, description, price, quantity, arrivalDate, status, senderName, receiverName, orderDate } = req.body
    const photos = req.files.map((file) => `/uploads/${file.filename}`)

    const newProduct = {
      id: crypto.randomUUID(),
      transactionId: generateTransactionId(),
      name,
      description,
      price: Number.parseFloat(price),
      photos,
      quantity: Number.parseInt(quantity),
      uploadDate: new Date().toISOString(),
      orderDate: orderDate || new Date().toISOString(),
      arrivalDate,
      shippingDate: new Date().toISOString(),
      quantitySent: 0,
      quantityLeft: Number.parseInt(quantity),
      status: status || "pending",
      senderName: senderName || "",
      receiverName: receiverName || "",
    }

    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    products.push(newProduct)

    await fs.writeFile(GOODS_FILE, JSON.stringify(products, null, 2))
    res.status(201).json(newProduct)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to add product" })
  }
})

// Update product
app.put("/api/products/:id", upload.array("photos", 5), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      arrivalDate,
      shippingDate,
      quantitySent,
      status,
      senderName,
      receiverName,
      orderDate,
    } = req.body

    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    const index = products.findIndex((p) => p.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: "Product not found" })
    }

    const updatedProduct = { ...products[index] }

    if (name) updatedProduct.name = name
    if (description) updatedProduct.description = description
    if (price) updatedProduct.price = Number.parseFloat(price)
    if (quantity) {
      updatedProduct.quantity = Number.parseInt(quantity)
      updatedProduct.quantityLeft = Number.parseInt(quantity) - (updatedProduct.quantitySent || 0)
    }
    if (arrivalDate) updatedProduct.arrivalDate = arrivalDate
    if (shippingDate) updatedProduct.shippingDate = shippingDate
    if (quantitySent) {
      updatedProduct.quantitySent = Number.parseInt(quantitySent)
      updatedProduct.quantityLeft = updatedProduct.quantity - Number.parseInt(quantitySent)
    }

    if (status) updatedProduct.status = status
    if (senderName) updatedProduct.senderName = senderName
    if (receiverName) updatedProduct.receiverName = receiverName
    if (orderDate) updatedProduct.orderDate = orderDate

    if (req.files && req.files.length > 0) {
      updatedProduct.photos = req.files.map((file) => `/uploads/${file.filename}`)
    }

    products[index] = updatedProduct
    await fs.writeFile(GOODS_FILE, JSON.stringify(products, null, 2))

    res.json(updatedProduct)
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" })
  }
})

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const data = await fs.readFile(GOODS_FILE, "utf8")
    const products = JSON.parse(data)
    const filteredProducts = products.filter((p) => p.id !== req.params.id)

    if (filteredProducts.length === products.length) {
      return res.status(404).json({ error: "Product not found" })
    }

    await fs.writeFile(GOODS_FILE, JSON.stringify(filteredProducts, null, 2))
    res.json({ message: "Product deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" })
  }
})

// Verify admin credentials
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body

  if (username === "cblprolog" && password === "cblpro001") {
    res.json({ success: true })
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" })
  }
})

// Start server
async function startServer() {
  await ensureDataDir()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()

