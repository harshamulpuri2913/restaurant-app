'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
import ContactFooter from '@/components/ContactFooter'

interface Category {
  id: string
  name: string
  description: string | null
  _count: {
    items: number
  }
}

interface InvestedItem {
  id: string
  name: string
  categoryId: string
  category: Category
  customFields: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export default function InvestedItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<InvestedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedItemModal, setSelectedItemModal] = useState<string | null>(null) // Item ID to show in modal
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'date', 'week', 'month', 'threeMonths'
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [purchasePage, setPurchasePage] = useState<number>(1)
  const purchasesPerPage = 5

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  })

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    categoryId: '',
    customFields: {} as Record<string, any>,
  })
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<
    Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' }>
  >([])

  // Predefined fields that users can select
  const predefinedFields = [
    { key: 'dayOfPurchase', label: 'Day of Purchase', type: 'date' as const },
    { key: 'price', label: 'Price', type: 'number' as const },
    { key: 'qty', label: 'Qty', type: 'number' as const },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' as const },
    { key: 'vendor', label: 'Vendor', type: 'text' as const },
    { key: 'weight', label: 'Weight', type: 'text' as const },
  ]

  // Purchase entries state (for adding multiple purchases to an item)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<string | null>(null)
  const [purchaseForm, setPurchaseForm] = useState({
    dayOfPurchase: new Date().toISOString().split('T')[0],
    price: '',
    qty: '1',
    expiryDate: '',
    weight: '',
    vendor: '',
  })

  // Helper to get purchases array from item (sorted by date, newest first)
  const getPurchases = (item: InvestedItem): Array<{
    dayOfPurchase: string
    price: number
    qty: number
    expiryDate: string
    weight: string
    vendor: string
  }> => {
    let purchases: Array<{
      dayOfPurchase: string
      price: number
      qty: number
      expiryDate: string
      weight: string
      vendor: string
    }> = []

    if (item.customFields?.purchases && Array.isArray(item.customFields.purchases)) {
      purchases = item.customFields.purchases
    } else if (item.customFields?.dayOfPurchase) {
      // If old format (single purchase), convert to array
      purchases = [{
        dayOfPurchase: item.customFields.dayOfPurchase || '',
        price: item.customFields.price || 0,
        qty: item.customFields.qty || 1,
        expiryDate: item.customFields.expiryDate || '',
        weight: item.customFields.weight || '',
        vendor: item.customFields.vendor || '',
      }]
    }

    // Sort by date (newest first)
    return purchases.sort((a, b) => {
      const dateA = new Date(a.dayOfPurchase || '1970-01-01').getTime()
      const dateB = new Date(b.dayOfPurchase || '1970-01-01').getTime()
      return dateB - dateA // Newest first
    })
  }

  // Get paginated purchases
  const getPaginatedPurchases = (purchases: ReturnType<typeof getPurchases>) => {
    const startIndex = (purchasePage - 1) * purchasesPerPage
    const endIndex = startIndex + purchasesPerPage
    return {
      paginated: purchases.slice(startIndex, endIndex),
      totalPages: Math.ceil(purchases.length / purchasesPerPage),
      totalPurchases: purchases.length,
    }
  }

  const handleAddPurchase = async () => {
    try {
      if (!selectedItemForPurchase) return

      const item = items.find(i => i.id === selectedItemForPurchase)
      if (!item) return

      if (!purchaseForm.dayOfPurchase || !purchaseForm.price) {
        toast.error('Purchase date and price are required')
        return
      }

      const existingPurchases = getPurchases(item)
      const newPurchase = {
        dayOfPurchase: purchaseForm.dayOfPurchase,
        price: parseFloat(purchaseForm.price) || 0,
        qty: parseInt(purchaseForm.qty) || 1,
        expiryDate: purchaseForm.expiryDate || '',
        weight: purchaseForm.weight || '',
        vendor: purchaseForm.vendor || '',
      }

      const updatedPurchases = [...existingPurchases, newPurchase]

      // Update item with new purchases array
      const res = await fetch(`/api/invested-items/${selectedItemForPurchase}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          categoryId: item.categoryId,
          customFields: {
            ...item.customFields,
            purchases: updatedPurchases,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add purchase')
      }

      toast.success('Purchase added successfully')
      const wasItemModalOpen = selectedItemModal === selectedItemForPurchase

      setShowPurchaseForm(false)
      setSelectedItemForPurchase(null)
      setPurchaseForm({
        dayOfPurchase: new Date().toISOString().split('T')[0],
        price: '',
        qty: '1',
        expiryDate: '',
        weight: '',
        vendor: '',
      })

      // Refresh data
      await fetchData()

      // If the item modal was open for this item, keep it open and reset page
      if (wasItemModalOpen) {
        setPurchasePage(1)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add purchase')
    }
  }

  const handleDeletePurchase = async (itemId: string, purchaseIndex: number) => {
    try {
      if (!confirm('Are you sure you want to delete this purchase entry?')) return

      const item = items.find(i => i.id === itemId)
      if (!item) return

      // Get all purchases (unsorted for deletion)
      let purchases: Array<{
        dayOfPurchase: string
        price: number
        qty: number
        expiryDate: string
        weight: string
        vendor: string
      }> = []

      if (item.customFields?.purchases && Array.isArray(item.customFields.purchases)) {
        purchases = [...item.customFields.purchases]
      } else if (item.customFields?.dayOfPurchase) {
        purchases = [{
          dayOfPurchase: item.customFields.dayOfPurchase || '',
          price: item.customFields.price || 0,
          qty: item.customFields.qty || 1,
          expiryDate: item.customFields.expiryDate || '',
          weight: item.customFields.weight || '',
          vendor: item.customFields.vendor || '',
        }]
      }

      // Get sorted purchases to find the correct one to delete
      const sortedPurchases = getPurchases(item)
      if (purchaseIndex >= 0 && purchaseIndex < sortedPurchases.length) {
        const purchaseToDelete = sortedPurchases[purchaseIndex]
        // Find and remove from original array
        const indexToDelete = purchases.findIndex((p, i) => {
          return p.dayOfPurchase === purchaseToDelete.dayOfPurchase &&
            p.price === purchaseToDelete.price &&
            p.qty === purchaseToDelete.qty
        })
        if (indexToDelete >= 0) {
          purchases.splice(indexToDelete, 1)
        }
      }

      const res = await fetch(`/api/invested-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          categoryId: item.categoryId,
          customFields: {
            ...item.customFields,
            purchases: purchases.length > 0 ? purchases : null,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete purchase')
      }

      toast.success('Purchase deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete purchase')
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/signin')
      return
    }
    if (session.user.role !== 'admin') {
      router.push('/menu')
      return
    }
    // Test database connection first
    testDatabaseConnection().then(() => {
      fetchData()
    })
  }, [session, status, router])

  // Reset purchase page when filter changes
  useEffect(() => {
    setPurchasePage(1)
  }, [dateFilter, selectedDate])

  const testDatabaseConnection = async () => {
    try {
      const res = await fetch('/api/invested-items/test')
      const data = await res.json()
      if (!data.success) {
        // Only show one error message, not multiple
        const errorMsg = data.error + (data.solution ? `\n\n${data.solution}` : '')
        toast.error(errorMsg, {
          duration: 15000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line',
          }
        })
        console.error('Database test failed:', data)
      } else {
        console.log('✅ Database connection successful:', data)
      }
    } catch (error) {
      console.error('Database test error:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const categoriesRes = await fetch('/api/invested-items/categories')
      const categoriesData = await categoriesRes.json()

      if (!categoriesRes.ok) {
        const errorMsg = categoriesData.error || 'Failed to fetch categories'
        const details = categoriesData.details || categoriesData.message
        const solution = categoriesData.solution || ''
        throw new Error(`${errorMsg}${details ? `: ${details}` : ''}${solution ? ` - ${solution}` : ''}`)
      }

      // Check for API errors in response
      if (categoriesData.error) {
        const errorMsg = categoriesData.error
        const details = categoriesData.details || categoriesData.message
        const solution = categoriesData.solution || ''
        throw new Error(`${errorMsg}${details ? `: ${details}` : ''}${solution ? ` - ${solution}` : ''}`)
      }

      // Fetch items
      const itemsRes = await fetch('/api/invested-items')
      const itemsData = await itemsRes.json()

      if (!itemsRes.ok) {
        const errorMsg = itemsData.error || 'Failed to fetch items'
        const details = itemsData.details || itemsData.message
        const solution = itemsData.solution || ''
        throw new Error(`${errorMsg}${details ? `: ${details}` : ''}${solution ? ` - ${solution}` : ''}`)
      }

      // Check for API errors in response
      if (itemsData.error) {
        const errorMsg = itemsData.error
        const details = itemsData.details || itemsData.message
        const solution = itemsData.solution || ''
        throw new Error(`${errorMsg}${details ? `: ${details}` : ''}${solution ? ` - ${solution}` : ''}`)
      }

      // Ensure we always have arrays
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setItems(Array.isArray(itemsData) ? itemsData : [])
    } catch (error: any) {
      console.error('Fetch data error:', error)
      const errorMessage = error.message || 'Failed to load data'
      toast.error(errorMessage, { duration: 8000 })
      // Set empty arrays on error
      setCategories([])
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!categoryForm.name.trim()) {
        toast.error('Category name is required')
        return
      }

      const res = await fetch('/api/invested-items/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || null,
          parentCategoryId: null, // No parent categories
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error + (error.details ? `: ${error.details}` : '') || 'Failed to create category')
      }

      toast.success('Category created successfully')
      setShowCategoryForm(false)
      setCategoryForm({ name: '', description: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
    }
  }

  const handleUpdateCategory = async (categoryId: string) => {
    try {
      if (!categoryForm.name.trim()) {
        toast.error('Category name is required')
        return
      }

      const res = await fetch(`/api/invested-items/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || null,
          parentCategoryId: null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update category')
      }

      toast.success('Category updated successfully')
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '' })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all items in this category.')) {
      return
    }

    try {
      const res = await fetch(`/api/invested-items/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    })
    setShowCategoryForm(true)
  }

  const handleCreateItem = async () => {
    try {
      if (!itemForm.name.trim()) {
        toast.error('Item name is required')
        return
      }
      if (!itemForm.categoryId) {
        toast.error('Category is required')
        return
      }

      const customFields: Record<string, any> = {}
      customFieldDefinitions.forEach((field) => {
        if (itemForm.customFields[field.key] !== undefined) {
          customFields[field.key] = itemForm.customFields[field.key]
        }
      })

      const res = await fetch('/api/invested-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemForm.name,
          categoryId: itemForm.categoryId,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create item')
      }

      toast.success('Item created successfully')
      setShowItemForm(false)
      setItemForm({ name: '', categoryId: '', customFields: {} })
      setCustomFieldDefinitions([])
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create item')
    }
  }

  const handleUpdateItem = async (itemId: string) => {
    try {
      if (!itemForm.name.trim()) {
        toast.error('Item name is required')
        return
      }
      if (!itemForm.categoryId) {
        toast.error('Category is required')
        return
      }

      const customFields: Record<string, any> = {}
      customFieldDefinitions.forEach((field) => {
        if (itemForm.customFields[field.key] !== undefined) {
          customFields[field.key] = itemForm.customFields[field.key]
        }
      })

      const res = await fetch(`/api/invested-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemForm.name,
          categoryId: itemForm.categoryId,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update item')
      }

      toast.success('Item updated successfully')
      setEditingItem(null)
      setItemForm({ name: '', categoryId: '', customFields: {} })
      setCustomFieldDefinitions([])
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const res = await fetch(`/api/invested-items/${itemId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete item')
      }

      toast.success('Item deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item')
    }
  }

  const handleEditItem = (item: InvestedItem) => {
    setEditingItem(item.id)
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      customFields: item.customFields || {},
    })

    // Extract custom field definitions from existing item
    const fields: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' }> = []
    if (item.customFields && typeof item.customFields === 'object') {
      Object.keys(item.customFields).forEach((key) => {
        const value = item.customFields![key]
        let type: 'text' | 'number' | 'date' | 'boolean' = 'text'
        if (typeof value === 'number') type = 'number'
        else if (typeof value === 'boolean') type = 'boolean'
        else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) type = 'date'
        fields.push({ key, label: key, type })
      })
    }
    setCustomFieldDefinitions(fields)
    setShowItemForm(true)
  }

  const addPredefinedField = (field: { key: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' }) => {
    // Check if field already exists
    if (customFieldDefinitions.some((f) => f.key === field.key)) {
      toast.error(`${field.label} is already added`)
      return
    }

    setCustomFieldDefinitions([...customFieldDefinitions, field])
    setItemForm({
      ...itemForm,
      customFields: { ...itemForm.customFields, [field.key]: field.type === 'number' ? 0 : '' },
    })
  }

  const addCustomField = () => {
    const key = prompt('Enter field key (e.g., "location", "notes", "supplier"):')
    if (!key || key.trim() === '') return

    // Check if it's a predefined field
    if (predefinedFields.some((f) => f.key === key.trim())) {
      toast.error('This field is already available in predefined fields. Please select it from there.')
      return
    }

    const label = prompt('Enter field label (e.g., "Location", "Notes", "Supplier"):') || key
    const type = prompt('Enter field type (text/number/date/boolean):') || 'text'

    if (!['text', 'number', 'date', 'boolean'].includes(type)) {
      toast.error('Invalid field type. Use: text, number, date, or boolean')
      return
    }

    setCustomFieldDefinitions([
      ...customFieldDefinitions,
      { key: key.trim(), label: label.trim(), type: type as 'text' | 'number' | 'date' | 'boolean' },
    ])
    setItemForm({
      ...itemForm,
      customFields: { ...itemForm.customFields, [key.trim()]: type === 'number' ? 0 : '' },
    })
  }

  const removeCustomField = (key: string) => {
    setCustomFieldDefinitions(customFieldDefinitions.filter((f) => f.key !== key))
    const newCustomFields = { ...itemForm.customFields }
    delete newCustomFields[key]
    setItemForm({ ...itemForm, customFields: newCustomFields })
  }

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return items
    return items.filter((item) => item.categoryId === selectedCategory)
  }

  const getAllCategoriesFlat = () => {
    return Array.isArray(categories) ? categories : []
  }

  // Helper to check if a purchase date matches the filter
  const purchaseMatchesFilter = (purchaseDate: string): boolean => {
    if (dateFilter === 'all' || !purchaseDate) return true

    const now = new Date()
    const filterDate = selectedDate ? new Date(selectedDate) : now
    const purchase = new Date(purchaseDate)

    // Reset time to start of day for accurate comparison
    purchase.setHours(0, 0, 0, 0)
    filterDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    switch (dateFilter) {
      case 'date':
        return purchase.getTime() === filterDate.getTime()
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        weekAgo.setHours(0, 0, 0, 0)
        return purchase >= weekAgo && purchase <= now
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        monthAgo.setHours(0, 0, 0, 0)
        return purchase >= monthAgo && purchase <= now
      case 'threeMonths':
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        threeMonthsAgo.setHours(0, 0, 0, 0)
        return purchase >= threeMonthsAgo && purchase <= now
      default:
        return true
    }
  }

  // Get filtered purchases for an item
  const getFilteredPurchases = (item: InvestedItem) => {
    const purchases = getPurchases(item)
    if (dateFilter === 'all') return purchases
    return purchases.filter(p => purchaseMatchesFilter(p.dayOfPurchase))
  }

  const getItemsByCategory = (categoryId: string) => {
    let filtered = items.filter((item) => item.categoryId === categoryId)

    // Apply date filter - only show items that have purchases matching the filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const filteredPurchases = getFilteredPurchases(item)
        return filteredPurchases.length > 0
      })
    }

    return filtered
  }

  const getCategoryStats = (categoryId: string) => {
    const categoryItems = getItemsByCategory(categoryId)
    const totalItems = categoryItems.length
    const totalAmount = categoryItems.reduce((sum, item) => {
      const purchases = getFilteredPurchases(item) // Use filtered purchases
      if (purchases.length > 0) {
        return sum + purchases.reduce((pSum, purchase) => {
          return pSum + (Number(purchase.price) * Number(purchase.qty))
        }, 0)
      }
      return sum
    }, 0)
    return { totalItems, totalAmount }
  }

  const getOverallStats = () => {
    const allFilteredItems = selectedCategory === 'all'
      ? categories.flatMap(cat => getItemsByCategory(cat.id))
      : getItemsByCategory(selectedCategory)

    const totalItems = allFilteredItems.length
    const totalAmount = allFilteredItems.reduce((sum, item) => {
      const purchases = getFilteredPurchases(item) // Use filtered purchases
      if (purchases.length > 0) {
        return sum + purchases.reduce((pSum, purchase) => {
          return pSum + (Number(purchase.price) * Number(purchase.qty))
        }, 0)
      }
      return sum
    }, 0)

    return { totalItems, totalAmount }
  }

  if (loading) {
    return (
      <div className="min-h-screen textured-bg">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-golden text-2xl">Loading...</div>
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
            <h1 className="text-4xl golden-text font-traditional">Inventory</h1>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setShowCategoryForm(true)
                  setEditingCategory(null)
                  setCategoryForm({ name: '', description: '' })
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors font-traditional"
              >
                + Add Category
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
              >
                {showFilters ? '▼' : '▶'} Filters
              </button>
              <button
                onClick={() => {
                  setShowItemForm(true)
                  setEditingItem(null)
                  setItemForm({ name: '', categoryId: '', customFields: {} })
                  setCustomFieldDefinitions([])
                }}
                className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
              >
                + Add Item
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-golden text-deep-brown px-6 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 bg-traditional-brown rounded-lg traditional-border">
              <h3 className="text-golden font-traditional mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-light-gold mb-2 font-traditional">Filter by Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-deep-brown border-2 border-golden rounded-lg text-cream font-traditional"
                  >
                    <option value="all">All Categories</option>
                    {getAllCategoriesFlat().map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-light-gold mb-2 font-traditional">Filter by Date:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value)
                      if (e.target.value === 'date') {
                        setSelectedDate(new Date().toISOString().split('T')[0])
                      }
                    }}
                    className="w-full px-4 py-2 bg-deep-brown border-2 border-golden rounded-lg text-cream font-traditional"
                  >
                    <option value="all">All Time</option>
                    <option value="date">Specific Date</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="threeMonths">Last 3 Months</option>
                  </select>
                </div>
                {dateFilter === 'date' && (
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Select Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2 bg-deep-brown border-2 border-golden rounded-lg text-cream font-traditional"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="mb-6 p-4 bg-traditional-brown rounded-lg traditional-border">
            <h3 className="text-golden font-traditional mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedCategory === 'all' ? (
                <>
                  {categories.map((category) => {
                    const stats = getCategoryStats(category.id)
                    return (
                      <div key={category.id} className="bg-deep-brown p-3 rounded border border-golden">
                        <p className="text-cream font-bold text-sm">{category.name}</p>
                        <p className="text-light-gold text-xs mt-1">
                          Items: {stats.totalItems} | Total: ${stats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    )
                  })}
                  <div className="bg-golden p-3 rounded border-2 border-golden">
                    <p className="text-deep-brown font-bold text-sm">Grand Total</p>
                    {(() => {
                      const overall = getOverallStats()
                      return (
                        <p className="text-deep-brown text-xs mt-1 font-bold">
                          Items: {overall.totalItems} | Total: ${overall.totalAmount.toFixed(2)}
                        </p>
                      )
                    })()}
                  </div>
                </>
              ) : (
                (() => {
                  const category = categories.find(c => c.id === selectedCategory)
                  const stats = category ? getCategoryStats(category.id) : { totalItems: 0, totalAmount: 0 }
                  return (
                    <>
                      <div className="bg-deep-brown p-3 rounded border border-golden">
                        <p className="text-cream font-bold text-sm">{category?.name || 'Selected Category'}</p>
                        <p className="text-light-gold text-xs mt-1">
                          Items: {stats.totalItems} | Total: ${stats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-golden p-3 rounded border-2 border-golden">
                        <p className="text-deep-brown font-bold text-sm">Total</p>
                        <p className="text-deep-brown text-xs mt-1 font-bold">
                          Items: {stats.totalItems} | Total: ${stats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )
                })()
              )}
            </div>
          </div>

          {/* Category Form Modal */}
          {showCategoryForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-deep-brown p-6 rounded-lg max-w-md w-full mx-4 traditional-border">
                <h2 className="text-2xl golden-text font-traditional mb-4">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="Category description"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (editingCategory) {
                          handleUpdateCategory(editingCategory)
                        } else {
                          handleCreateCategory()
                        }
                      }}
                      className="flex-1 bg-golden text-deep-brown px-4 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
                    >
                      {editingCategory ? 'Update' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCategoryForm(false)
                        setEditingCategory(null)
                        setCategoryForm({ name: '', description: '' })
                      }}
                      className="flex-1 bg-traditional-brown text-cream px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item Form Modal */}
          {showItemForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-deep-brown p-6 rounded-lg max-w-2xl w-full mx-4 traditional-border my-8">
                <h2 className="text-2xl golden-text font-traditional mb-4">
                  {editingItem ? 'Edit Item' : 'Create Item'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Name *</label>
                    <input
                      type="text"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="Item name"
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Category *</label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                    >
                      <option value="">Select category</option>
                      {getAllCategoriesFlat().map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-light-gold mb-3 font-traditional">Custom Fields</label>

                    {/* Predefined Fields Section */}
                    <div className="mb-4 p-3 bg-traditional-brown rounded border border-golden">
                      <p className="text-cream text-sm mb-2 font-traditional">Select from predefined fields:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {predefinedFields.map((field) => {
                          const isAdded = customFieldDefinitions.some((f) => f.key === field.key)
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => addPredefinedField(field)}
                              disabled={isAdded}
                              className={`px-3 py-2 rounded text-sm font-bold transition-colors font-traditional ${isAdded
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                              {isAdded ? '✓ ' : '+ '}{field.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Add Custom Field Button */}
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="bg-golden text-deep-brown px-4 py-2 rounded text-sm font-bold hover:bg-light-gold transition-colors font-traditional"
                      >
                        + Create Custom Field
                      </button>
                    </div>

                    {/* Selected Fields */}
                    {customFieldDefinitions.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <p className="text-cream text-sm font-traditional">Selected Fields:</p>
                        {customFieldDefinitions.map((field) => (
                          <div key={field.key} className="mb-3 p-3 bg-traditional-brown rounded border border-golden">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-cream font-bold">{field.label} ({field.type})</span>
                              <button
                                onClick={() => removeCustomField(field.key)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={itemForm.customFields[field.key] || ''}
                                onChange={(e) =>
                                  setItemForm({
                                    ...itemForm,
                                    customFields: { ...itemForm.customFields, [field.key]: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 bg-deep-brown border border-golden rounded text-cream"
                                placeholder={`Enter ${field.label}`}
                              />
                            )}
                            {field.type === 'number' && (
                              <div>
                                {field.key === 'price' ? (
                                  <div className="flex items-center">
                                    <span className="text-cream mr-2">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={itemForm.customFields[field.key] || ''}
                                      onChange={(e) =>
                                        setItemForm({
                                          ...itemForm,
                                          customFields: { ...itemForm.customFields, [field.key]: parseFloat(e.target.value) || 0 },
                                        })
                                      }
                                      className="flex-1 px-3 py-2 bg-deep-brown border border-golden rounded text-cream"
                                      placeholder="0.00"
                                    />
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    value={itemForm.customFields[field.key] || ''}
                                    onChange={(e) =>
                                      setItemForm({
                                        ...itemForm,
                                        customFields: { ...itemForm.customFields, [field.key]: parseInt(e.target.value) || 0 },
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-deep-brown border border-golden rounded text-cream"
                                    placeholder={`Enter ${field.label}`}
                                  />
                                )}
                              </div>
                            )}
                            {field.type === 'date' && (
                              <input
                                type="date"
                                value={itemForm.customFields[field.key] || ''}
                                onChange={(e) =>
                                  setItemForm({
                                    ...itemForm,
                                    customFields: { ...itemForm.customFields, [field.key]: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 bg-deep-brown border border-golden rounded text-cream"
                              />
                            )}
                            {field.type === 'boolean' && (
                              <select
                                value={itemForm.customFields[field.key] === true ? 'true' : itemForm.customFields[field.key] === false ? 'false' : ''}
                                onChange={(e) =>
                                  setItemForm({
                                    ...itemForm,
                                    customFields: { ...itemForm.customFields, [field.key]: e.target.value === 'true' },
                                  })
                                }
                                className="w-full px-3 py-2 bg-deep-brown border border-golden rounded text-cream"
                              >
                                <option value="">Select</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (editingItem) {
                          handleUpdateItem(editingItem)
                        } else {
                          handleCreateItem()
                        }
                      }}
                      className="flex-1 bg-golden text-deep-brown px-4 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowItemForm(false)
                        setEditingItem(null)
                        setItemForm({ name: '', categoryId: '', customFields: {} })
                        setCustomFieldDefinitions([])
                      }}
                      className="flex-1 bg-traditional-brown text-cream px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Purchase Modal */}
          {showPurchaseForm && selectedItemForPurchase && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
              <div className="bg-deep-brown p-6 rounded-lg max-w-md w-full mx-4 traditional-border">
                <h2 className="text-2xl golden-text font-traditional mb-4">
                  Add Purchase Entry
                </h2>
                <p className="text-cream text-sm mb-4 font-traditional">
                  Add a new purchase for: <span className="font-bold text-golden">
                    {items.find(i => i.id === selectedItemForPurchase)?.name}
                  </span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Day of Purchase *</label>
                    <input
                      type="date"
                      value={purchaseForm.dayOfPurchase}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, dayOfPurchase: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Price *</label>
                    <div className="flex items-center">
                      <span className="text-cream mr-2">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={purchaseForm.price}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, price: e.target.value })}
                        className="flex-1 px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={purchaseForm.qty}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Expiry Date</label>
                    <input
                      type="date"
                      value={purchaseForm.expiryDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Weight</label>
                    <input
                      type="text"
                      value={purchaseForm.weight}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, weight: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="e.g., 2kg, 5lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-light-gold mb-2 font-traditional">Vendor</label>
                    <input
                      type="text"
                      value={purchaseForm.vendor}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor: e.target.value })}
                      className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
                      placeholder="Vendor name"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddPurchase}
                      className="flex-1 bg-golden text-deep-brown px-4 py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
                    >
                      Add Purchase
                    </button>
                    <button
                      onClick={() => {
                        setShowPurchaseForm(false)
                        setSelectedItemForPurchase(null)
                        setPurchaseForm({
                          dayOfPurchase: new Date().toISOString().split('T')[0],
                          price: '',
                          qty: '1',
                          expiryDate: '',
                          weight: '',
                          vendor: '',
                        })
                      }}
                      className="flex-1 bg-traditional-brown text-cream px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item Details Modal */}
          {selectedItemModal && (() => {
            const item = items.find(i => i.id === selectedItemModal)
            if (!item) return null

            // Get filtered purchases based on date filter
            const purchases = getFilteredPurchases(item)
            const { paginated, totalPages, totalPurchases } = getPaginatedPurchases(purchases)

            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                <div className="bg-deep-brown p-6 rounded-lg max-w-4xl w-full traditional-border my-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl golden-text font-traditional">{item.name}</h2>
                    <button
                      onClick={() => {
                        setSelectedItemModal(null)
                        setPurchasePage(1)
                      }}
                      className="text-cream hover:text-light-gold text-3xl font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-traditional-brown rounded border border-golden">
                    <p className="text-cream text-sm">
                      <span className="font-bold text-light-gold">Category:</span> {item.category.name}
                    </p>
                    <p className="text-cream text-sm mt-1">
                      <span className="font-bold text-light-gold">Total Purchases:</span> {totalPurchases}
                      {dateFilter !== 'all' && (
                        <span className="text-light-gold ml-2">(filtered by {dateFilter === 'date' ? 'date' : dateFilter === 'week' ? 'last week' : dateFilter === 'month' ? 'last month' : 'last 3 months'})</span>
                      )}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl golden-text font-traditional">Purchase History</h3>
                      <button
                        onClick={() => {
                          setSelectedItemForPurchase(item.id)
                          setPurchaseForm({
                            dayOfPurchase: new Date().toISOString().split('T')[0],
                            price: '',
                            qty: '1',
                            expiryDate: '',
                            weight: '',
                            vendor: '',
                          })
                          setShowPurchaseForm(true)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700"
                      >
                        + Add Purchase
                      </button>
                    </div>

                    {purchases.length > 0 ? (
                      <>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {paginated.map((purchase, pageIndex) => {
                            // Calculate the actual index in the sorted purchases array
                            const realIndex = (purchasePage - 1) * purchasesPerPage + pageIndex

                            return (
                              <div key={`${item.id}-${realIndex}`} className="bg-traditional-brown p-4 rounded border-2 border-golden">
                                <div className="flex justify-between items-start">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
                                    <div>
                                      <p className="text-light-gold text-xs font-bold mb-1">Purchase Date</p>
                                      <p className="text-cream text-sm">{purchase.dayOfPurchase || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-light-gold text-xs font-bold mb-1">Price</p>
                                      <p className="text-cream text-sm">${purchase.price.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="text-light-gold text-xs font-bold mb-1">Quantity</p>
                                      <p className="text-cream text-sm">{purchase.qty}</p>
                                    </div>
                                    {purchase.expiryDate && (
                                      <div>
                                        <p className="text-light-gold text-xs font-bold mb-1">Expiry Date</p>
                                        <p className="text-cream text-sm">{purchase.expiryDate}</p>
                                      </div>
                                    )}
                                    {purchase.weight && (
                                      <div>
                                        <p className="text-light-gold text-xs font-bold mb-1">Weight</p>
                                        <p className="text-cream text-sm">{purchase.weight}</p>
                                      </div>
                                    )}
                                    {purchase.vendor && (
                                      <div>
                                        <p className="text-light-gold text-xs font-bold mb-1">Vendor</p>
                                        <p className="text-cream text-sm">{purchase.vendor}</p>
                                      </div>
                                    )}
                                    <div className="col-span-2 md:col-span-3">
                                      <p className="text-golden text-sm font-bold mt-2">
                                        Total: ${(purchase.price * purchase.qty).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      await handleDeletePurchase(item.id, realIndex)
                                      // Adjust page if needed
                                      if (paginated.length === 1 && purchasePage > 1) {
                                        setPurchasePage(purchasePage - 1)
                                      }
                                    }}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 ml-4"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-golden">
                            <button
                              onClick={() => setPurchasePage(Math.max(1, purchasePage - 1))}
                              disabled={purchasePage === 1}
                              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${purchasePage === 1
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-golden text-deep-brown hover:bg-light-gold'
                                }`}
                            >
                              ← Previous
                            </button>
                            <span className="text-cream text-sm font-traditional">
                              Page {purchasePage} of {totalPages} ({totalPurchases} total entries)
                            </span>
                            <button
                              onClick={() => setPurchasePage(Math.min(totalPages, purchasePage + 1))}
                              disabled={purchasePage === totalPages}
                              className={`px-4 py-2 rounded text-sm font-bold transition-colors ${purchasePage === totalPages
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-golden text-deep-brown hover:bg-light-gold'
                                }`}
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 bg-traditional-brown rounded border border-golden">
                        <p className="text-cream text-sm mb-4">No purchases recorded</p>
                        <button
                          onClick={() => {
                            setSelectedItemForPurchase(item.id)
                            setPurchaseForm({
                              dayOfPurchase: new Date().toISOString().split('T')[0],
                              price: '',
                              qty: '1',
                              expiryDate: '',
                              weight: '',
                              vendor: '',
                            })
                            setShowPurchaseForm(true)
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700"
                        >
                          + Add First Purchase
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedItemModal(null)
                        setPurchasePage(1)
                      }}
                      className="flex-1 bg-traditional-brown text-cream px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Categories Section */}
          <div className="mb-8">
            <h2 className="text-2xl golden-text font-traditional mb-4">Categories</h2>
            <div className="space-y-4">
              {Array.isArray(categories) && categories.length > 0 ? categories
                .filter((category) => selectedCategory === 'all' || category.id === selectedCategory)
                .map((category) => (
                  <div key={category.id} className="bg-traditional-brown p-4 rounded-lg traditional-border">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-cream font-bold text-lg">{category.name}</h3>
                        {category.description && (
                          <p className="text-light-gold text-sm mt-1">{category.description}</p>
                        )}
                        <div className="text-cream text-xs mt-2">
                          {(() => {
                            const stats = getCategoryStats(category.id)
                            return (
                              <>
                                <p>Items: {stats.totalItems}</p>
                                <p className="text-light-gold">Total: ${stats.totalAmount.toFixed(2)}</p>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedCategories)
                            if (newExpanded.has(category.id)) {
                              newExpanded.delete(category.id)
                            } else {
                              newExpanded.add(category.id)
                            }
                            setExpandedCategories(newExpanded)
                          }}
                          className="bg-golden text-deep-brown px-3 py-1 rounded text-sm font-bold hover:bg-light-gold"
                        >
                          {expandedCategories.has(category.id) ? '▼' : '▶'} Items
                        </button>
                      </div>
                    </div>
                    {expandedCategories.has(category.id) && getItemsByCategory(category.id).length > 0 && (
                      <div className="mt-4 ml-4 space-y-2">
                        {getItemsByCategory(category.id).map((item) => {
                          const filteredPurchases = getFilteredPurchases(item)
                          return (
                            <div key={item.id} className="bg-deep-brown p-3 rounded border border-golden">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <h4 className="text-cream font-bold">{item.name}</h4>
                                  <span className="text-light-gold text-xs">
                                    {filteredPurchases.length} purchase{filteredPurchases.length !== 1 ? 's' : ''}
                                    {dateFilter !== 'all' && (
                                      <span className="text-cream"> (filtered)</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedItemModal(item.id)
                                      setPurchasePage(1) // Reset to first page
                                    }}
                                    className="bg-golden text-deep-brown px-3 py-1 rounded text-sm font-bold hover:bg-light-gold"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )) : (
                <p className="text-cream text-center py-4">No categories yet. Create one to get started!</p>
              )}
            </div>
          </div>

        </div>
      </div>
      <ContactFooter />
    </div>
  )
}

