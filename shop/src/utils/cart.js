const CART_KEY = 'mp_cart_v1'

export function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY)
        return raw ? JSON.parse(raw) : []
    } catch (e) {
        return []
    }
}

export function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export function addToCart(item, qty = 1) {
    const cart = getCart()
    const idx = cart.findIndex(c => c.id === item.id)
    if (idx >= 0) {
        cart[idx].qty = Math.min((cart[idx].qty || 0) + qty, item.stock || 9999)
    } else {
        cart.push({...item, qty })
    }
    saveCart(cart)
}

export function removeFromCart(id) {
    const cart = getCart().filter(c => c.id !== id)
    saveCart(cart)
}

export function updateQty(id, qty) {
    const cart = getCart().map(c => c.id === id ? {...c, qty } : c)
    saveCart(cart)
}

export function getCartCount() {
    return getCart().reduce((s, i) => s + (i.qty || 0), 0)
}

export function getCartSubtotal() {
    return getCart().reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)
}