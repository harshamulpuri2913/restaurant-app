'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import ContactFooter from '@/components/ContactFooter'

interface Product {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  unit: string
  image: string | null
  isAvailable: boolean
  isHidden: boolean
  preOrderOnly: boolean
  variants?: Record<string, number> | null // { "250gm": 5.00, "500gm": 9.00, "1kg": 17.00 }
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [editingVariants, setEditingVariants] = useState<Record<string, number>>({})
  const [variantType, setVariantType] = useState<'pieces' | 'size' | 'none'>('none') // For sweets: pieces or size
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'snacks',
    price: 0,
    unit: '250g',
    preOrderOnly: false,
  })
  const [newProductVariants, setNewProductVariants] = useState<Record<string, number>>({})
  const [newProductVariantType, setNewProductVariantType] = useState<'pieces' | 'size' | 'none'>('none')

  useEffect(() => {
    if (!session) {
      router.push('/signin')
      return
    }
    if (session.user.role !== 'admin') {
      router.push('/menu')
      return
    }
    fetchProducts()
  }, [session, router])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id)
    setEditForm({
      name: product.name,
      price: product.price,
      description: product.description || '',
      isHidden: product.isHidden,
      preOrderOnly: product.preOrderOnly,
    })
    // Initialize variants editing
    if (product.variants) {
      setEditingVariants({ ...product.variants })
      // Determine variant type for sweets
      if (product.category === 'sweets') {
        const hasPieces = product.variants['Each'] || product.variants['5 pieces'] || product.variants['10 pieces']
        const hasSize = product.variants['250gm'] || product.variants['500gm'] || product.variants['1kg']
        if (hasPieces) {
          setVariantType('pieces')
        } else if (hasSize) {
          setVariantType('size')
        } else {
          setVariantType('none')
        }
      } else {
        setVariantType('none')
      }
    } else {
      setEditingVariants({})
      setVariantType('none')
    }
  }

  const handleUpdate = async (productId: string) => {
    try {
      const updateData = { ...editForm }
      const product = products.find(p => p.id === productId)
      
      // Handle variants for snacks/pickles (size-based), sweets (pieces or size-based), and biryani/mandi/curry (tray-based)
      if (product?.category === 'snacks' || product?.category === 'pickles' || product?.category === 'sweets' || product?.category === 'biryani' || product?.category === 'mandi' || product?.category === 'curry') {
        // If variants are set, use them; otherwise use null
        if (Object.keys(editingVariants).length > 0 && Object.values(editingVariants).some(v => v > 0)) {
          // Ensure all variant values are numbers
          const normalizedVariants: Record<string, number> = {}
          for (const [key, price] of Object.entries(editingVariants)) {
            if (price && price > 0) {
              normalizedVariants[key] = typeof price === 'string' ? parseFloat(price) : Number(price)
            }
          }
          updateData.variants = Object.keys(normalizedVariants).length > 0 ? normalizedVariants : null
        } else {
          updateData.variants = null
        }
      }
      
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.message || 'Failed to update')
      }

      toast.success('Product updated!')
      setEditingProduct(null)
      setEditingVariants({})
      fetchProducts()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    }
  }

  const handleToggleHidden = async (productId: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !currentValue }),
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success(`Product ${!currentValue ? 'hidden' : 'shown'}`)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  const handleImageUpload = async (productId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(`/api/products/${productId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload')

      toast.success('Image uploaded!')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to upload image')
    }
  }

  const handleDeleteImage = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })

      if (!res.ok) throw new Error('Failed to delete image')

      toast.success('Image deleted!')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete image')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product')
      }

      if (data.message) {
        toast.success(data.message)
      } else {
        toast.success('Product deleted!')
      }
      fetchProducts()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    }
  }

  const handleAddProduct = async () => {
    try {
      const productData: any = { ...newProduct }
      // If snacks category and variants are set, include them
      if ((newProduct.category === 'snacks' || newProduct.category === 'pickles' || newProduct.category === 'sweets' || newProduct.category === 'biryani' || newProduct.category === 'mandi' || newProduct.category === 'curry') && Object.keys(newProductVariants).length > 0 && Object.values(newProductVariants).some(v => v > 0)) {
        productData.variants = newProductVariants
      }
      
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (!res.ok) throw new Error('Failed to create')

      toast.success('Product added!')
      setShowAddForm(false)
      setNewProduct({
        name: '',
        description: '',
        category: 'snacks',
        price: 0,
        unit: '250g',
        preOrderOnly: false,
      })
      setNewProductVariants({})
      setNewProductVariantType('none')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to add product')
    }
  }

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = []
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  if (status === 'loading') {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-golden text-2xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-golden text-2xl">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen textured-bg">
      <Header />
      <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl golden-text font-traditional">Manage Products</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
            >
              {showAddForm ? 'Cancel' : '+ Add Product'}
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="traditional-border bg-deep-brown p-6 rounded-lg mb-6">
            <h2 className="text-2xl golden-text mb-4 font-traditional">Add New Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-light-gold mb-2 font-traditional">Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                  required
                />
              </div>
              <div>
                <label className="block text-light-gold mb-2 font-traditional">Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                >
                  <option value="snacks">Snacks</option>
                  <option value="sweets">Sweets</option>
                  <option value="pickles">Pickles</option>
                  <option value="mandi">Mandi</option>
                  <option value="biryani">Biryani</option>
                  <option value="curry">Curry</option>
                </select>
              </div>
              <div>
                <label className="block text-light-gold mb-2 font-traditional">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                  required
                />
                <p className="text-xs text-light-gold mt-1">Base price (used if variants not set)</p>
              </div>
              <div>
                <label className="block text-light-gold mb-2 font-traditional">Unit *</label>
                <input
                  type="text"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="250g, Each, etc."
                  className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                  required
                />
              </div>
              {(newProduct.category === 'snacks' || newProduct.category === 'pickles') && (
                <div className="md:col-span-2">
                  <label className="block text-light-gold mb-2 font-traditional">Size Variants (Optional):</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['250gm', '500gm', '1kg'].map((size) => (
                      <div key={size}>
                        <label className="block text-cream text-sm mb-1">{size}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProductVariants[size] || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            setNewProductVariants({ ...newProductVariants, [size]: value })
                          }}
                          className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable size selection for customers.</p>
                </div>
              )}
              {newProduct.category === 'sweets' && (
                <div className="md:col-span-2">
                  <label className="block text-light-gold mb-2 font-traditional">Variant Type:</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-cream text-sm">
                      <input
                        type="radio"
                        name="newProductVariantType"
                        checked={newProductVariantType === 'pieces'}
                        onChange={() => {
                          setNewProductVariantType('pieces')
                          setNewProductVariants({})
                        }}
                        className="w-4 h-4"
                      />
                      Pieces (Each, 5 pieces, 10 pieces)
                    </label>
                    <label className="flex items-center gap-2 text-cream text-sm">
                      <input
                        type="radio"
                        name="newProductVariantType"
                        checked={newProductVariantType === 'size'}
                        onChange={() => {
                          setNewProductVariantType('size')
                          setNewProductVariants({})
                        }}
                        className="w-4 h-4"
                      />
                      Size (250gm, 500gm, 1kg)
                    </label>
                    <label className="flex items-center gap-2 text-cream text-sm">
                      <input
                        type="radio"
                        name="newProductVariantType"
                        checked={newProductVariantType === 'none'}
                        onChange={() => {
                          setNewProductVariantType('none')
                          setNewProductVariants({})
                        }}
                        className="w-4 h-4"
                      />
                      None (Use base price)
                    </label>
                  </div>
                  {newProductVariantType === 'pieces' && (
                    <div className="grid grid-cols-3 gap-4">
                      {['Each', '5 pieces', '10 pieces'].map((piece) => (
                        <div key={piece}>
                          <label className="block text-cream text-sm mb-1">{piece}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProductVariants[piece] || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                              setNewProductVariants({ ...newProductVariants, [piece]: value })
                            }}
                            className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {newProductVariantType === 'size' && (
                    <div className="grid grid-cols-3 gap-4">
                      {['250gm', '500gm', '1kg'].map((size) => (
                        <div key={size}>
                          <label className="block text-cream text-sm mb-1">{size}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newProductVariants[size] || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                              setNewProductVariants({ ...newProductVariants, [size]: value })
                            }}
                            className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                            <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable variant selection for customers.</p>
                </div>
              )}
              {(newProduct.category === 'biryani' || newProduct.category === 'mandi' || newProduct.category === 'curry') && (
                <div className="md:col-span-2">
                  <label className="block text-light-gold mb-2 font-traditional">Tray Variants (Optional):</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Family Pack', 'Half Tray', 'Full Tray'].map((tray) => (
                      <div key={tray}>
                        <label className="block text-cream text-sm mb-1">{tray}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProductVariants[tray] || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                            setNewProductVariants({ ...newProductVariants, [tray]: value })
                          }}
                          className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable variant selection for customers.</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-light-gold mb-2 font-traditional">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-light-gold font-traditional">
                  <input
                    type="checkbox"
                    checked={newProduct.preOrderOnly}
                    onChange={(e) => setNewProduct({ ...newProduct, preOrderOnly: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Pre-order Only
                </label>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleAddProduct}
                  className="w-full bg-golden text-deep-brown py-3 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products by Category */}
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="traditional-border bg-deep-brown p-6 rounded-lg mb-6">
            <h2 className="text-2xl golden-text mb-4 font-traditional capitalize">
              {category}
            </h2>
            <div className="space-y-4">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-traditional-brown p-4 rounded-lg flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="text-cream font-bold text-lg">
                          {product.name}
                          {product.preOrderOnly && (
                            <span className="ml-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                              Pre-order Only
                            </span>
                          )}
                          {product.isHidden && (
                            <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                              Hidden
                            </span>
                          )}
                        </p>
                        <p className="text-light-gold text-sm">
                          ${product.price} / {product.unit}
                        </p>
                        {product.description && (
                          <p className="text-cream text-sm mt-1">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingProduct === product.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-3 py-1 bg-deep-brown border border-golden rounded text-cream flex-1"
                            placeholder="Product Name"
                          />
                          <div className="flex flex-col">
                            <label className="text-cream text-xs mb-1">Price *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                              className="px-3 py-1 bg-deep-brown border border-golden rounded text-cream w-28"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        {(product.category === 'snacks' || product.category === 'pickles') && (
                          <div className="bg-deep-brown p-3 rounded border border-golden">
                            <label className="block text-light-gold text-sm mb-2 font-traditional">Size Variants (Optional):</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['250gm', '500gm', '1kg'].map((size) => (
                                <div key={size}>
                                  <label className="block text-cream text-xs mb-1">{size}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingVariants[size] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                      setEditingVariants({ ...editingVariants, [size]: value })
                                    }}
                                    className="w-full px-2 py-1 bg-traditional-brown border border-golden rounded text-cream text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable size selection.</p>
                          </div>
                        )}
                        {product.category === 'sweets' && (
                          <div className="bg-deep-brown p-3 rounded border border-golden">
                            <label className="block text-light-gold text-sm mb-2 font-traditional">Variant Type:</label>
                            <div className="flex gap-4 mb-3">
                              <label className="flex items-center gap-2 text-cream text-sm">
                                <input
                                  type="radio"
                                  name={`variantType-${product.id}`}
                                  checked={variantType === 'pieces'}
                                  onChange={() => {
                                    setVariantType('pieces')
                                    setEditingVariants({})
                                  }}
                                  className="w-4 h-4"
                                />
                                Pieces (Each, 5 pieces, 10 pieces)
                              </label>
                              <label className="flex items-center gap-2 text-cream text-sm">
                                <input
                                  type="radio"
                                  name={`variantType-${product.id}`}
                                  checked={variantType === 'size'}
                                  onChange={() => {
                                    setVariantType('size')
                                    setEditingVariants({})
                                  }}
                                  className="w-4 h-4"
                                />
                                Size (250gm, 500gm, 1kg)
                              </label>
                              <label className="flex items-center gap-2 text-cream text-sm">
                                <input
                                  type="radio"
                                  name={`variantType-${product.id}`}
                                  checked={variantType === 'none'}
                                  onChange={() => {
                                    setVariantType('none')
                                    setEditingVariants({})
                                  }}
                                  className="w-4 h-4"
                                />
                                None (Use base price)
                              </label>
                            </div>
                            {variantType === 'pieces' && (
                              <div className="grid grid-cols-3 gap-2">
                                {['Each', '5 pieces', '10 pieces'].map((piece) => (
                                  <div key={piece}>
                                    <label className="block text-cream text-xs mb-1">{piece}</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingVariants[piece] || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                        setEditingVariants({ ...editingVariants, [piece]: value })
                                      }}
                                      className="w-full px-2 py-1 bg-traditional-brown border border-golden rounded text-cream text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            {variantType === 'size' && (
                              <div className="grid grid-cols-3 gap-2">
                                {['250gm', '500gm', '1kg'].map((size) => (
                                  <div key={size}>
                                    <label className="block text-cream text-xs mb-1">{size}</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingVariants[size] || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                        setEditingVariants({ ...editingVariants, [size]: value })
                                      }}
                                      className="w-full px-2 py-1 bg-traditional-brown border border-golden rounded text-cream text-sm"
                                      placeholder="0.00"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable variant selection.</p>
                          </div>
                        )}
                        {(product.category === 'biryani' || product.category === 'mandi' || product.category === 'curry') && (
                          <div className="bg-deep-brown p-3 rounded border border-golden">
                            <label className="block text-light-gold text-sm mb-2 font-traditional">Tray Variants (Optional):</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['Family Pack', 'Half Tray', 'Full Tray'].map((tray) => (
                                <div key={tray}>
                                  <label className="block text-cream text-xs mb-1">{tray}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingVariants[tray] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                                      setEditingVariants({ ...editingVariants, [tray]: value })
                                    }}
                                    className="w-full px-2 py-1 bg-traditional-brown border border-golden rounded text-cream text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-light-gold mt-2">Leave empty to use base price. Set prices to enable variant selection.</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(product.id)}
                            className="bg-green-600 text-white px-4 py-1 rounded font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(null)
                              setEditingVariants({})
                            }}
                            className="bg-gray-600 text-white px-4 py-1 rounded font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(product)}
                          className="bg-golden text-deep-brown px-4 py-2 rounded font-bold hover:bg-light-gold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleHidden(product.id, product.isHidden)}
                          className={`px-4 py-2 rounded font-bold ${
                            product.isHidden
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          }`}
                        >
                          {product.isHidden ? 'Show' : 'Hide'}
                        </button>
                        <label className="bg-blue-600 text-white px-4 py-2 rounded font-bold cursor-pointer hover:bg-blue-700">
                          📷 Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(product.id, file)
                            }}
                          />
                        </label>
                        {product.image && (
                          <button
                            onClick={() => handleDeleteImage(product.id)}
                            className="bg-orange-600 text-white px-4 py-2 rounded font-bold hover:bg-orange-700"
                          >
                            🗑️ Delete Image
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
      <ContactFooter />
    </div>
  )
}

